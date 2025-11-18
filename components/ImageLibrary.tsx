import React, { useState } from 'react';
import type { UserImage } from '../types';
import * as api from '../services/mockApi';
import Spinner from './Spinner';

interface ImageLibraryProps {
  images: UserImage[];
  onImageUpload: (image: UserImage) => void;
  onImageDelete: (id: string) => void;
}

const ImageLibrary: React.FC<ImageLibraryProps> = ({ images, onImageUpload, onImageDelete }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
      });

      const dataUrl = await toBase64(file);

      // 1. Create the image record in the mock database
      const { newImage } = await api.getUploadUrl(file.name, file.type);
      
      // 2. "Upload" by passing the data URL to the mock API to store
      const finalImage = await api.mockUploadFile(newImage, dataUrl);
      
      // 3. Update the UI with the completed image record
      onImageUpload(finalImage);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during upload.';
      console.error("Upload failed", err);
      setError(errorMessage);
    } finally {
        setUploading(false);
    }
    event.target.value = ''; // Reset file input
  };
  
  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Image Library</h2>
        <label className={`
          bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition-colors
          ${uploading ? 'bg-slate-600 cursor-not-allowed' : ''}
        `}>
          {uploading ? 'Uploading...' : 'Upload Image'}
          <input type="file" className="hidden" onChange={handleFileChange} disabled={uploading} accept="image/*" />
        </label>
      </div>
      {error && <p className="text-sm text-red-400 mb-4">Upload Error: {error}</p>}
      {images.length === 0 && !uploading ? (
        <p className="text-slate-400 text-center py-4">Your library is empty. Upload an image to get started.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2">
            {uploading && (
                <div className="aspect-square bg-slate-700 rounded-md flex items-center justify-center">
                    <Spinner />
                </div>
            )}
            {images.map(image => (
                <div key={image.id} className="relative group aspect-square">
                <img src={image.url} alt={image.name} className="w-full h-full object-cover rounded-md" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => onImageDelete(image.id)} className="text-red-500 hover:text-red-400 p-2 rounded-full bg-slate-800/50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                    </svg>
                    </button>
                </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default ImageLibrary;