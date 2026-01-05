
import React, { useRef, useState } from 'react';
import { extractWordsFromFile } from '../services/geminiService';

interface FileUploaderProps {
  onWordsExtracted: (words: string[]) => void;
  onProcessing: (isProcessing: boolean) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onWordsExtracted, onProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError("Please pick a Picture or a PDF file! 📄🖼️");
      return;
    }

    setError(null);
    onProcessing(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64String = (event.target?.result as string).split(',')[1];
        const words = await extractWordsFromFile(base64String, file.type);
        
        if (words.length > 0) {
          onWordsExtracted(words);
        } else {
          setError("I couldn't find any words in that file. Is it clear? 🤔");
        }
        onProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.onerror = () => {
        setError("Something went wrong reading the file.");
        onProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError("AI is taking a nap. Try again later! 😴");
      onProcessing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-lg border-4 border-orange-200 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-orange-600 mb-4 flex items-center">
        <span className="mr-2">📄</span> Upload PDF or Photo
      </h2>
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="flex-1 border-4 border-dashed border-orange-100 rounded-2xl p-8 text-center cursor-pointer hover:bg-orange-50 hover:border-orange-300 transition-all flex flex-col items-center justify-center min-h-[160px]"
      >
        <div className="text-6xl mb-3">📁</div>
        <p className="text-orange-800 font-bold text-lg">Click to Upload File</p>
        <p className="text-orange-400 text-sm mt-1">Accepts PDF or Images</p>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*,application/pdf" 
          className="hidden" 
        />
      </div>

      {error && (
        <p className="mt-4 text-red-500 font-medium text-center bg-red-50 p-2 rounded-xl border border-red-100">
          {error}
        </p>
      )}
    </div>
  );
};

export default FileUploader;
