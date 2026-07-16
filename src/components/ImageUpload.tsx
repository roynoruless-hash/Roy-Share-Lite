import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
}

export function ImageUpload({ label, value, onChange, placeholder, className = "" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        await uploadFile(file);
      } else {
        alert("Please upload an image file");
      }
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      setProgress(0);
      
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
      const storageRef = ref(storage, `giveaways/${fileName}`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          alert("Failed to upload image.");
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onChange(downloadURL);
          setUploading(false);
        }
      );
    } catch (err) {
      console.error("Setup upload error:", err);
      setUploading(false);
    }
  };

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs font-bold text-slate-400">{label}</label>
      
      <div 
        className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl transition-colors ${
          isDragOver ? 'border-blue-500 bg-blue-500/10' : 
          value ? 'border-slate-800 bg-slate-950' : 'border-slate-800 hover:border-slate-700 bg-slate-950'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />
        
        {uploading ? (
          <div className="flex flex-col items-center justify-center py-6 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
            <span className="text-xs font-medium">Uploading... {Math.round(progress)}%</span>
            <div className="w-32 h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : value ? (
          <div className="relative w-full group">
            <div className="aspect-[21/9] w-full rounded-lg overflow-hidden bg-slate-900 border border-slate-800 relative">
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button 
                  onClick={(e) => { e.preventDefault(); triggerSelect(); }}
                  className="p-2 bg-blue-600/90 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  title="Replace Image"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.preventDefault(); onChange(""); }}
                  className="p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-lg transition-colors"
                  title="Remove Image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
               <input
                 type="text"
                 value={value}
                 onChange={(e) => onChange(e.target.value)}
                 className="flex-1 bg-transparent border-none text-xs text-slate-400 focus:outline-none"
                 placeholder={placeholder || "https://..."}
               />
            </div>
          </div>
        ) : (
          <div 
            onClick={triggerSelect}
            className="flex flex-col items-center justify-center py-6 cursor-pointer text-slate-400 hover:text-slate-300 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
              <ImageIcon className="w-5 h-5 text-slate-500" />
            </div>
            <span className="text-sm font-medium mb-1">Click to upload or drag & drop</span>
            <span className="text-xs text-slate-500">SVG, PNG, JPG or GIF (max. 5MB)</span>
            
            <div className="mt-4 flex w-full max-w-xs items-center" onClick={(e) => e.stopPropagation()}>
              <span className="text-xs text-slate-600 mr-2 shrink-0">Or URL:</span>
              <input
                 type="text"
                 value={value}
                 onChange={(e) => onChange(e.target.value)}
                 className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white placeholder-slate-600 focus:border-blue-500/50 outline-none"
                 placeholder={placeholder || "https://..."}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
