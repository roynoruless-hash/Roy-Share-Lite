import { doc as fsDoc, collection as fsCollection, DocumentReference, CollectionReference, DocumentData } from "firebase/firestore";

// Setup dynamic/safe context providers for backend and frontend
let getActiveBotIdFunc = () => "default";
let runInContextFunc = (context: { botId: string }, callback: () => void) => { callback(); };

let serverStorage: any = null;

export function registerServerStorage(storage: any) {
  serverStorage = storage;
  getActiveBotIdFunc = () => {
    const store = storage.getStore();
    return store?.botId || "default";
  };
  runInContextFunc = (context: { botId: string }, callback: () => void) => {
    storage.run(context, callback);
  };
}

if (typeof window !== "undefined") {
  // Client-side uses localized state / localStorage
  let currentClientBotId = "default";
  try {
    currentClientBotId = localStorage.getItem("current_bot_id") || "default";
  } catch (e) {}

  getActiveBotIdFunc = () => {
    return currentClientBotId;
  };

  (globalThis as any).setClientBotId = (id: string) => {
    currentClientBotId = id;
    try {
      localStorage.setItem("current_bot_id", id);
    } catch (e) {}
  };
}

export function getActiveBotId(): string {
  return getActiveBotIdFunc();
}

export function setClientBotId(id: string) {
  if (typeof window !== "undefined") {
    (globalThis as any).setClientBotId(id);
  }
}

export const botContextStorage = {
  run: (context: { botId: string }, callback: () => void) => {
    runInContextFunc(context, callback);
  }
};

export function doc(db: any, path?: string, ...pathSegments: string[]): DocumentReference<DocumentData, DocumentData> {
  if (path === undefined) {
    return fsDoc(db) as any;
  }
  const botId = getActiveBotId();
  if (!botId || botId === "default" || botId === "undefined") {
    return fsDoc(db, path, ...pathSegments) as any;
  }
  // Redirect to subcollection of the specific bot
  return fsDoc(db, "bots", botId, path, ...pathSegments) as any;
}

export function collection(db: any, path: string, ...pathSegments: string[]): CollectionReference<DocumentData, DocumentData> {
  const botId = getActiveBotId();
  if (!botId || botId === "default" || botId === "undefined") {
    return fsCollection(db, path, ...pathSegments) as any;
  }
  // Redirect to subcollection of the specific bot
  return fsCollection(db, "bots", botId, path, ...pathSegments) as any;
}
