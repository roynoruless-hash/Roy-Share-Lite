import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
}

const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = error => reject(error);
});

export function ImageUpload({ label, value, onChange, placeholder, className = "" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      e.target.value = ''; // clear input so same file can be re-selected if needed
      await uploadFile(file);
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
      setProgress(10);
      
      const base64 = await toBase64(file);
      setProgress(40);
      
      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ base64, folder: "giveaways" })
      });
      
      const data = await response.json();
      setProgress(100);
      
      if (response.ok && data.success && data.url) {
        onChange(data.url);
      } else {
        console.error("Upload error:", data.error);
        alert(data.error || "Failed to upload image.");
      }
    } catch (err) {
      console.error("Setup upload error:", err);
      alert("An unexpected error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  const triggerSelect = (e?: React.MouseEvent) => {
    e?.stopPropagation();
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
                  onClick={(e) => { e.preventDefault(); triggerSelect(e); }}
                  className="p-2 bg-blue-600/90 hover:bg-blue-600 text-white rounded-lg transition-colors cursor-pointer"
                  title="Replace Image"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.preventDefault(); onChange(""); }}
                  className="p-2 bg-red-600/90 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer"
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
            className="flex flex-col items-center justify-center py-6 cursor-pointer text-slate-400 hover:text-slate-300 transition-colors w-full h-full"
          >
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
              <ImageIcon className="w-5 h-5 text-slate-500" />
            </div>
            <span className="text-sm font-medium mb-1">Click to upload or drag & drop</span>
            <span className="text-xs text-slate-500">SVG, PNG, JPG or GIF (max. 15MB)</span>
            
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