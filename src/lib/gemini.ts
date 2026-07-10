import { GoogleGenAI } from "@google/genai";

const PROHIBITED_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-pro",
  "gemini-2.0-flash",
  "gemini-2.0-pro",
  "gemini-2.0-flash-thinking",
  "models/gemini-pro"
];

function isProhibited(modelName: string): boolean {
  if (!modelName) return false;
  const normalized = modelName.toLowerCase();
  return PROHIBITED_MODELS.some(p => normalized.includes(p));
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}

/**
 * Robust Gemini content generation with model fallback and error handling.
 */
export async function safeGenerateContent(ai: any, params: any): Promise<any> {
  let baseModel = params.model || "gemini-3.5-flash";
  if (isProhibited(baseModel)) {
    baseModel = "gemini-3.5-flash";
  }

  // 1. Try to list available models dynamically
  let apiModels: string[] = [];
  try {
    const listResponse = await ai.models.list();
    let rawList: any[] = [];
    if (Array.isArray(listResponse)) {
      rawList = listResponse;
    } else if (listResponse && Array.isArray(listResponse.models)) {
      rawList = listResponse.models;
    }

    apiModels = rawList
      .map((m: any) => m.name || m.model)
      .filter((name: any): name is string => typeof name === "string")
      .map((name: string) => name.replace(/^models\//, ""))
      .filter((name: string) => {
        return (name.startsWith("gemini-") || name.includes("gemini")) && !isProhibited(name);
      });
  } catch (e) {
    console.warn("[Gemini API] Failed to list models, falling back to static allowed list.", e);
  }

  const staticAllowed = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.1-pro-preview"
  ];

  const modelsToTry = [
    baseModel,
    ...apiModels,
    ...staticAllowed
  ];

  const uniqueModels = [...new Set(modelsToTry)]
    .filter(m => m && typeof m === "string")
    .map(m => m.trim())
    .filter(m => !isProhibited(m));

  let lastError: any = null;
  const timeoutMs = params.timeout || 15000;

  for (const modelName of uniqueModels) {
    try {
      const sanitizedModelName = modelName.startsWith("models/") ? modelName : `models/${modelName}`;
      
      console.log(`[Gemini API] Attempting generateContent with model: ${sanitizedModelName}`);
      
      const response = await withTimeout(
        ai.models.generateContent({
          ...params,
          model: sanitizedModelName
        }),
        timeoutMs,
        `Request timed out after ${timeoutMs}ms on model ${modelName}`
      );
      
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = err.message || "";
      let errorSummary = errMsg;
      
      try {
        if (errMsg.includes("{")) {
          const jsonMatch = errMsg.match(/\{.*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            errorSummary = parsed.error?.message || errorSummary;
          }
        }
      } catch (e) {}

      console.warn(`[Gemini Fallback] Model ${modelName} failed: ${errorSummary}`);

      // Continue trying other models
      continue;
    }
  }

  if (lastError) {
    let finalErrorMsg = lastError.message || "Unknown error";
    try {
      if (finalErrorMsg.includes("{")) {
        const jsonMatch = finalErrorMsg.match(/\{.*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          finalErrorMsg = parsed.error?.message || finalErrorMsg;
        }
      }
    } catch (e) {}

    const friendlyError = new Error(`Gemini AI is currently unavailable. ${finalErrorMsg}`);
    (friendlyError as any).status = lastError.status || 500;
    throw friendlyError;
  }
  
  throw new Error("Gemini AI integration failed: No valid models were able to respond.");
}

/**
 * Robust Gemini chat interaction with model fallback and error handling.
 */
export async function safeSendMessage(ai: any, params: any): Promise<any> {
  let baseModel = params.model || "gemini-3.5-flash";
  if (isProhibited(baseModel)) {
    baseModel = "gemini-3.5-flash";
  }

  let apiModels: string[] = [];
  try {
    const listResponse = await ai.models.list();
    let rawList: any[] = [];
    if (Array.isArray(listResponse)) {
      rawList = listResponse;
    } else if (listResponse && Array.isArray(listResponse.models)) {
      rawList = listResponse.models;
    }

    apiModels = rawList
      .map((m: any) => m.name || m.model)
      .filter((name: any): name is string => typeof name === "string")
      .map((name: string) => name.replace(/^models\//, ""))
      .filter((name: string) => {
        return (name.startsWith("gemini-") || name.includes("gemini")) && !isProhibited(name);
      });
  } catch (e) {
    console.warn("[Gemini API] Failed to list models for chat, falling back to static allowed list.", e);
  }

  const staticAllowed = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.1-pro-preview"
  ];

  const modelsToTry = [
    baseModel,
    ...apiModels,
    ...staticAllowed
  ];

  const uniqueModels = [...new Set(modelsToTry)]
    .filter(m => m && typeof m === "string")
    .map(m => m.trim())
    .filter(m => !isProhibited(m));

  let lastError: any = null;
  const timeoutMs = params.timeout || 15000;

  for (const modelName of uniqueModels) {
    try {
      const sanitizedModelName = modelName.startsWith("models/") ? modelName : `models/${modelName}`;
      
      const chat = ai.chats.create({
        ...params.config,
        model: sanitizedModelName,
        history: params.history || []
      });

      const response = await withTimeout(
        chat.sendMessage({ message: params.message }),
        timeoutMs,
        `Chat request timed out after ${timeoutMs}ms on model ${modelName}`
      );
      
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = err.message || "";
      console.warn(`[Gemini Chat Fallback] Model ${modelName} failed: ${errMsg.substring(0, 100)}`);
      continue;
    }
  }

  throw lastError || new Error("Gemini AI integration failed: No valid models were able to respond.");
}
