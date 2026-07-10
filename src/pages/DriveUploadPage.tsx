import { useState, useEffect, useRef } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useTelegramAuth } from "../context/TelegramAuthContext";
import { 
  Cloud, 
  UploadCloud, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowLeft, 
  Copy, 
  ExternalLink, 
  FileIcon,
  HardDrive,
  RefreshCw
} from "lucide-react";

export default function DriveUploadPage({ onBack }: { onBack?: () => void } = {}) {
  const { user, loading: authLoading } = useTelegramAuth();
  const [tgId, setTgId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"checking" | "disconnected" | "idle" | "uploading" | "finalizing" | "success" | "error">("checking");
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  
  // Progress states
  const [progress, setProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0); // bytes per second
  const [remainingTime, setRemainingTime] = useState(0); // seconds
  const [uploadedSize, setUploadedSize] = useState(0); // bytes
  const [totalSize, setTotalSize] = useState(0); // bytes
  
  // Result states
  const [royshareLink, setRoyshareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [currentUploadUrl, setCurrentUploadUrl] = useState<string>("");
  const [currentDriveFileId, setCurrentDriveFileId] = useState<string>("");
  const [failedStep, setFailedStep] = useState<number | null>(null);

  // Custom Settings States
  const [wantRename, setWantRename] = useState<"no" | "yes">("no");
  const [customFileName, setCustomFileName] = useState("");
  const [wantAlias, setWantAlias] = useState<"no" | "yes">("no");
  const [customAlias, setCustomAlias] = useState("");
  const [aliasError, setAliasError] = useState("");
  const [aliasValidating, setAliasValidating] = useState(false);
  const [wantPassword, setWantPassword] = useState<"no" | "yes">("no");
  const [password, setPassword] = useState("");

  const getFinalFileName = () => {
    if (!selectedFile) return "";
    if (wantRename === "yes" && customFileName.trim()) {
      const originalExt = selectedFile.name.split(".").pop() || "";
      let enteredName = customFileName.trim();
      if (originalExt && !enteredName.endsWith(`.${originalExt}`)) {
        enteredName = `${enteredName}.${originalExt}`;
      }
      return enteredName;
    }
    return selectedFile.name;
  };

  // Check alias uniqueness
  useEffect(() => {
    if (wantAlias === "no" || !customAlias.trim()) {
      setAliasError("");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(customAlias)) {
      setAliasError("Alias must only contain letters, numbers, hyphens, and underscores.");
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setAliasValidating(true);
      setAliasError("");
      try {
        const dSnap = await getDoc(doc(db, "uploads", customAlias.trim()));
        if (dSnap.exists()) {
          setAliasError("❌ This custom alias is already taken. Please choose another.");
        } else {
          setAliasError("");
        }
      } catch (err) {
        console.error("Error checking alias uniqueness:", err);
      }
      setAliasValidating(false);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [customAlias, wantAlias]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  useEffect(() => {
    // If auth is still loading, wait before throwing error
    if (authLoading) return;

    // Get tg_id from query parameters, Telegram WebApp, or AuthContext
    const params = new URLSearchParams(window.location.search);
    let id = params.get("tg_id") || params.get("tgId");

    const tg = (window as any).Telegram?.WebApp;
    if (!id && tg?.initDataUnsafe?.user?.id) {
      id = String(tg.initDataUnsafe.user.id);
    }

    if (!id && user?.id) {
      id = String(user.id);
    }

    if (id) {
      setTgId(id);
      checkDriveConnection(id);
    } else {
      setPhase("error");
      setError("Telegram user session not detected. Please open this page from the Telegram Bot.");
    }
  }, [user, authLoading]);

  const checkDriveConnection = async (userId: string) => {
    try {
      const response = await fetch(`/api/google-drive/status?tg_id=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to check connection status.");
      }
      const data = await response.json();
      if (data.connected) {
        setUserEmail(data.email || "Connected Account");
        setPhase("idle");
      } else {
        setPhase("disconnected");
      }
    } catch (err: any) {
      setPhase("error");
      setError(err.message || "An error occurred while validating Google Drive status.");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const maxSize = 10 * 1024 * 1024 * 1024; // 10 GB
    if (file.size > maxSize) {
      setError("File exceeds the maximum size limit of 10 GB.");
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const finalizeUpload = async (url: string, fileId?: string) => {
    if (!tgId || !selectedFile) return;
    setPhase("finalizing");
    setError(null);

    let targetDriveFileId = fileId || currentDriveFileId;
    const targetFileName = getFinalFileName();
    const targetFileSize = selectedFile.size;

    console.log("=== Google Drive Upload Completed ===");
    console.log("driveFileId received initially:", targetDriveFileId);

    // If driveFileId is missing because the browser does not expose the response,
    // recover it from the resumable upload session using uploadUrl before validation.
    if (!targetDriveFileId && url) {
      console.log("[Recovery Trace] driveFileId is empty. Attempting server-side session query using uploadUrl:", url);
      try {
        const recoveryResponse = await fetch("/api/google-drive/recover-file-id", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ uploadUrl: url, tg_id: tgId })
        });
        
        if (recoveryResponse.ok) {
          const recoveryData = await recoveryResponse.json();
          if (recoveryData.driveFileId) {
            targetDriveFileId = recoveryData.driveFileId;
            setCurrentDriveFileId(targetDriveFileId);
            console.log("[Recovery Trace] Successfully recovered driveFileId from server:", targetDriveFileId);
          } else {
            console.warn("[Recovery Trace] Server-side recovery returned ok, but driveFileId was missing in response.");
          }
        } else {
          const recoveryErrorText = await recoveryResponse.text();
          console.error("[Recovery Trace] Server-side recovery failed with status:", recoveryResponse.status, recoveryErrorText);
        }
      } catch (recoveryErr) {
        console.error("[Recovery Trace] Error recovering driveFileId from server:", recoveryErr);
      }
    }

    // Validate that none of the values are null or undefined
    const missingParams: string[] = [];
    if (!tgId) missingParams.push("tg_id");
    if (!targetDriveFileId) missingParams.push("driveFileId");
    if (!targetFileName) missingParams.push("fileName");
    if (targetFileSize === undefined || targetFileSize === null) missingParams.push("fileSize");

    if (missingParams.length > 0) {
      const errorMessage = `Missing required parameter(s): ${missingParams.join(", ")}`;
      console.error("[Finalize Error] Validation failed before calling server:", errorMessage);
      setFailedStep(2); // driveFileId is step 2
      setPhase("error");
      setError(errorMessage);
      return;
    }

    const payload = {
      tg_id: tgId,
      driveFileId: targetDriveFileId,
      fileName: targetFileName,
      fileSize: targetFileSize,
      mimeType: selectedFile.type || "application/octet-stream",
      uploadUrl: url,
      customAlias: wantAlias === "yes" && customAlias.trim() ? customAlias.trim() : "",
      password: wantPassword === "yes" && password.trim() ? password.trim() : ""
    };

    console.log("Finalize request payload:", JSON.stringify(payload, null, 2));

    try {
      const response = await fetch("/api/google-drive/finalize-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.step) {
          setFailedStep(data.step);
          if (data.driveFileId) {
            setCurrentDriveFileId(data.driveFileId);
          }
        } else {
          setFailedStep(4); // Default to Step 4 if not specified
        }
        throw new Error(data.details || data.error || "Failed to finalize the upload with RoyShare server.");
      }

      console.log("Firestore success: Metadata record generated.");
      console.log("Telegram success: Success notification sent.");
      console.log("RoyShare link generated:", data.royshareLink);

      setRoyshareLink(data.royshareLink);
      setPhase("success");
      setFailedStep(null);
    } catch (err: any) {
      setPhase("error");
      setError(err.message || "An error occurred while finalizing the file.");
    }
  };

  const startUpload = async () => {
    if (!selectedFile || !tgId) return;

    setError(null);
    setPhase("uploading");
    setProgress(0);
    setUploadSpeed(0);
    setRemainingTime(0);
    setUploadedSize(0);
    setTotalSize(selectedFile.size);
    setCurrentUploadUrl("");
    setCurrentDriveFileId("");
    setFailedStep(null);

    try {
      // Step 1: Initiate resumable upload session on server
      const initResponse = await fetch("/api/google-drive/initiate-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tg_id: tgId,
          fileName: getFinalFileName(),
          fileSize: selectedFile.size,
          mimeType: selectedFile.type
        })
      });

      const initData = await initResponse.json();
      if (!initResponse.ok) {
        const errorDetails = initData.details 
          ? (typeof initData.details === "object" ? JSON.stringify(initData.details, null, 2) : initData.details)
          : "";
        throw new Error(errorDetails ? `${initData.error || "Upload failed"}: ${errorDetails}` : (initData.error || "Failed to initiate resumable upload session."));
      }

      const { uploadUrl } = initData;
      setCurrentUploadUrl(uploadUrl);

      // Step 2: Upload directly to Google's Resumable session URL
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", selectedFile.type || "application/octet-stream");

      const startTime = Date.now();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const loaded = event.loaded;
          const total = event.total;
          const percent = Math.round((loaded / total) * 100);
          
          const now = Date.now();
          const duration = (now - startTime) / 1000; // seconds
          const speed = duration > 0 ? loaded / duration : 0; // bytes/sec
          
          const remainingBytes = total - loaded;
          const remainingTimeSec = speed > 0 ? remainingBytes / speed : 0;

          setProgress(percent);
          setUploadedSize(loaded);
          setUploadSpeed(speed);
          setRemainingTime(remainingTimeSec);
        }
      };

      xhr.onload = async () => {
        let driveFileId = "";
        try {
          if (xhr.status === 200 || xhr.status === 201) {
            const googleResponse = JSON.parse(xhr.responseText);
            driveFileId = googleResponse.id;
            if (driveFileId) {
              setCurrentDriveFileId(driveFileId);
            }
          }
        } catch (e) {
          console.warn("Failed to parse Google response body, server will query status:", e);
        }
        await finalizeUpload(uploadUrl, driveFileId);
      };

      xhr.onerror = async () => {
        console.warn("XHR error triggered, querying server to verify if upload actually finished on Google's side...");
        await finalizeUpload(uploadUrl);
      };

      xhr.send(selectedFile);

    } catch (err: any) {
      setPhase("error");
      setError(err.message || "An unexpected error occurred during initiation.");
    }
  };

  const cancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      setPhase("idle");
      setSelectedFile(null);
      setProgress(0);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(royshareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || seconds < 0) return "calculating...";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const triggerPicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div id="drive-upload-container" className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col items-center justify-center p-4">
      <div id="drive-upload-card" className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8">
        
        {/* HEADER */}
        <div id="upload-header" className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="mr-1 p-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors" title="Back">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Cloud className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">RoyShare Cloud</h1>
              <p className="text-xs text-slate-400">Large File Direct Uploader</p>
            </div>
          </div>
          {phase === "idle" && (
            <div className="flex items-center gap-1.5 text-xs bg-slate-800/80 px-2.5 py-1 rounded-full text-slate-300">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              <span className="truncate max-w-[150px]">{userEmail}</span>
            </div>
          )}
        </div>

        {/* ERROR DISPLAY */}
        {error && (
          <div id="upload-error-alert" className="mb-6 p-4 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex gap-3 items-start">
            <XCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <div>
              <p className="font-semibold">
                {failedStep && failedStep > 1 ? "Upload Completed (Finalization Failed)" : "Upload Error"}
              </p>
              {failedStep && failedStep > 1 ? (
                <div className="space-y-1.5 opacity-90 mt-1 select-text">
                  <p>The file was successfully uploaded to Google Drive, but a post-upload operation failed at <strong>Step {failedStep}</strong>:</p>
                  <p className="font-mono bg-slate-950/60 p-2.5 rounded-lg text-xs mt-1 border border-rose-500/20 max-h-[150px] overflow-auto select-text whitespace-pre-wrap">{error}</p>
                </div>
              ) : (
                <p className="opacity-90">{error}</p>
              )}
            </div>
          </div>
        )}

        {/* PHASE 1: CHECKING STATUS */}
        {phase === "checking" && (
          <div id="checking-loader" className="flex flex-col items-center py-12 text-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-300 font-medium">Validating connection status...</p>
            <p className="text-xs text-slate-500 mt-1">Please keep this tab open</p>
          </div>
        )}

        {/* PHASE 2: DISCONNECTED / NOT CONNECTED */}
        {phase === "disconnected" && (
          <div id="disconnected-message" className="flex flex-col items-center py-8 text-center">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mb-4 border border-amber-500/20">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Google Drive Disconnected</h2>
            <p className="text-sm text-slate-400 max-w-sm mb-6">
              You must link your Google Drive account before using the Large File Upload service.
            </p>
            <a 
              href={`https://www.royshare.online/api/google-drive/connect?tg_id=${tgId}`}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Cloud className="w-4 h-4" /> Connect Google Drive
            </a>
          </div>
        )}

        {/* PHASE 3: IDLE / READY FOR SELECTION */}
        {phase === "idle" && (
          <div id="idle-dropzone-view" className="space-y-6">
            {!selectedFile ? (
              <div 
                id="dropzone-area"
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerPicker}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[220px] ${
                  isDragActive 
                    ? "border-blue-500 bg-blue-500/5 text-blue-400" 
                    : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:bg-slate-950/20"
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                <UploadCloud className="w-12 h-12 text-slate-500 mb-4 animate-bounce" />
                <p className="text-white font-medium mb-1">Drag & drop your file here</p>
                <p className="text-xs text-slate-400 mb-2">or click to browse your local storage</p>
                <span className="text-[10px] uppercase tracking-wider bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-semibold">
                  Max Size: 10 GB
                </span>
              </div>
            ) : (
              <div className="space-y-6">
                <div id="selected-file-view" className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                    <FileIcon className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {getFinalFileName()}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatBytes(selectedFile.size)}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedFile(null);
                      setWantRename("no");
                      setCustomFileName("");
                      setWantAlias("no");
                      setCustomAlias("");
                      setWantPassword("no");
                      setPassword("");
                    }} 
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold uppercase tracking-wider px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 transition"
                  >
                    Clear
                  </button>
                </div>

                {/* OPTIONS PANEL */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-5 text-left">
                  <h3 className="text-sm font-semibold text-white tracking-wide uppercase opacity-90 border-b border-slate-800 pb-2 flex items-center gap-2">
                    <span>🛡️</span> Upload Settings
                  </h3>

                  {/* 1. Rename Option */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Do you want to rename this file?
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                        <input
                          type="radio"
                          name="wantRename"
                          value="no"
                          checked={wantRename === "no"}
                          onChange={() => setWantRename("no")}
                          className="text-blue-500 bg-slate-950 border-slate-700 focus:ring-blue-500"
                        />
                        No
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                        <input
                          type="radio"
                          name="wantRename"
                          value="yes"
                          checked={wantRename === "yes"}
                          onChange={() => setWantRename("yes")}
                          className="text-blue-500 bg-slate-950 border-slate-700 focus:ring-blue-500"
                        />
                        Yes
                      </label>
                    </div>

                    {wantRename === "yes" && (
                      <div className="space-y-1 pt-1">
                        <span className="text-xs text-slate-400 font-medium">File Name</span>
                        <input
                          type="text"
                          value={customFileName}
                          onChange={(e) => setCustomFileName(e.target.value)}
                          placeholder="Enter new file name (excluding extension)..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* 2. Custom Alias Option */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Custom Alias
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                        <input
                          type="radio"
                          name="wantAlias"
                          value="no"
                          checked={wantAlias === "no"}
                          onChange={() => setWantAlias("no")}
                          className="text-blue-500 bg-slate-950 border-slate-700 focus:ring-blue-500"
                        />
                        No
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                        <input
                          type="radio"
                          name="wantAlias"
                          value="yes"
                          checked={wantAlias === "yes"}
                          onChange={() => setWantAlias("yes")}
                          className="text-blue-500 bg-slate-950 border-slate-700 focus:ring-blue-500"
                        />
                        Yes
                      </label>
                    </div>

                    {wantAlias === "yes" && (
                      <div className="space-y-1 pt-1">
                        <span className="text-xs text-slate-400 font-medium">Alias</span>
                        <div className="relative">
                          <input
                            type="text"
                            value={customAlias}
                            onChange={(e) => setCustomAlias(e.target.value)}
                            placeholder="my-custom-link"
                            className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none ${
                              aliasError 
                                ? "border-rose-500 focus:border-rose-500" 
                                : customAlias.trim() && !aliasValidating 
                                  ? "border-emerald-500 focus:border-emerald-500" 
                                  : "border-slate-800 focus:border-blue-500"
                            }`}
                          />
                          {aliasValidating && (
                            <span className="absolute right-3 top-2.5 text-xs text-slate-500">Checking...</span>
                          )}
                        </div>
                        {aliasError && (
                          <p className="text-xs text-rose-400 font-medium">{aliasError}</p>
                        )}
                        {!aliasError && customAlias.trim() && !aliasValidating && (
                          <p className="text-xs text-emerald-400 font-medium">✓ Alias is unique and available</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 3. Password Protection Option */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Password Protect
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                        <input
                          type="radio"
                          name="wantPassword"
                          value="no"
                          checked={wantPassword === "no"}
                          onChange={() => setWantPassword("no")}
                          className="text-blue-500 bg-slate-950 border-slate-700 focus:ring-blue-500"
                        />
                        No
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                        <input
                          type="radio"
                          name="wantPassword"
                          value="yes"
                          checked={wantPassword === "yes"}
                          onChange={() => setWantPassword("yes")}
                          className="text-blue-500 bg-slate-950 border-slate-700 focus:ring-blue-500"
                        />
                        Yes
                      </label>
                    </div>

                    {wantPassword === "yes" && (
                      <div className="space-y-1 pt-1">
                        <span className="text-xs text-slate-400 font-medium">Password</span>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter file password..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div id="actions-footer" className="flex gap-3">
              <button
                disabled={
                  !selectedFile ||
                  (wantRename === "yes" && !customFileName.trim()) ||
                  (wantAlias === "yes" && (!customAlias.trim() || !!aliasError || aliasValidating)) ||
                  (wantPassword === "yes" && !password.trim())
                }
                onClick={startUpload}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition text-center flex items-center justify-center gap-2 ${
                  selectedFile &&
                  !(wantRename === "yes" && !customFileName.trim()) &&
                  !(wantAlias === "yes" && (!customAlias.trim() || !!aliasError || aliasValidating)) &&
                  !(wantPassword === "yes" && !password.trim())
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 cursor-pointer"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                }`}
              >
                <UploadCloud className="w-4 h-4" /> Start Secure Upload
              </button>
            </div>
          </div>
        )}

        {/* PHASE 4: UPLOADING */}
        {phase === "uploading" && (
          <div id="uploading-progress-view" className="space-y-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <p className="text-sm font-medium text-slate-300 truncate flex-1">
                Uploading: <span className="text-white font-semibold">{selectedFile?.name}</span>
              </p>
              <span className="text-sm font-bold text-blue-400">{progress}%</span>
            </div>

            {/* PROGRESS BAR */}
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            {/* SPEED & DETAILS */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
              <div>
                <p className="text-xs text-slate-500">Speed</p>
                <p className="text-sm font-bold text-white mt-0.5">{formatBytes(uploadSpeed)}/s</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Remaining Time</p>
                <p className="text-sm font-bold text-white mt-0.5">{formatTime(remainingTime)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Uploaded</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {formatBytes(uploadedSize)} <span className="text-slate-500 font-normal">/ {formatBytes(totalSize)}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Storage Target</p>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">Google Drive</p>
              </div>
            </div>

            <button 
              onClick={cancelUpload}
              className="w-full py-2.5 bg-slate-800 hover:bg-rose-950/30 hover:text-rose-400 text-slate-300 rounded-xl font-semibold text-xs transition uppercase tracking-wider border border-slate-700/50 hover:border-rose-900/30"
            >
              Cancel Upload
            </button>
          </div>
        )}

        {/* PHASE 5: FINALIZING */}
        {phase === "finalizing" && (
          <div id="finalizing-view" className="flex flex-col items-center py-10 text-center">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
            <h3 className="text-lg font-bold text-white">Generating RoyShare Link...</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              We are finalizing permissions on your connected Google Drive so visitors can download directly and securely.
            </p>
          </div>
        )}

        {/* PHASE 6: SUCCESS */}
        {phase === "success" && (
          <div id="success-results-view" className="space-y-6">
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 border border-emerald-500/20 mb-4 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-white">Upload Successful!</h2>
              <p className="text-xs text-slate-400 mt-1">
                Your RoyShare URL is ready and your Telegram Bot has been notified.
              </p>
            </div>

            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-3">
              <input 
                type="text" 
                readOnly 
                value={royshareLink} 
                className="bg-transparent border-none text-sm text-blue-400 font-semibold focus:ring-0 flex-1 min-w-0"
              />
              <button 
                onClick={copyToClipboard}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition relative"
                title="Copy Link"
              >
                <Copy className="w-4 h-4" />
                {copied && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded shadow font-semibold">
                    Copied!
                  </span>
                )}
              </button>
            </div>

            <div className="flex gap-3">
              <a 
                href={royshareLink}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 border border-slate-700"
              >
                <ExternalLink className="w-4 h-4" /> Open Link
              </a>
              <button 
                onClick={() => {
                  setSelectedFile(null);
                  setPhase("idle");
                  setRoyshareLink("");
                }}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition text-center shadow-lg shadow-blue-600/20"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* PHASE 7: GENERAL ERROR STATE / RETRY */}
        {phase === "error" && !error?.includes("session not detected") && (
          <div id="error-retry-action" className="flex flex-col items-center py-4 w-full">
            {failedStep && failedStep > 1 ? (
              <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                <button 
                  onClick={() => finalizeUpload(currentUploadUrl, currentDriveFileId)}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition text-center flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  <RefreshCw className="w-4 h-4 animate-spin-once" /> Retry Finalizing (No Re-upload)
                </button>
                <button 
                  onClick={() => {
                    setError(null);
                    setPhase("idle");
                    setSelectedFile(null);
                    setCurrentUploadUrl("");
                    setCurrentDriveFileId("");
                    setFailedStep(null);
                  }}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-sm transition border border-slate-700"
                >
                  Discard & Start Over
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setError(null);
                  setPhase("idle");
                  setSelectedFile(null);
                  setCurrentUploadUrl("");
                  setCurrentDriveFileId("");
                  setFailedStep(null);
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition shadow-lg shadow-blue-600/20"
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
