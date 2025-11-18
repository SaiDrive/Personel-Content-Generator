
import React, { useState, useEffect } from 'react';
import type { UserContext, UserImage, ContentItem } from '../types';
import { ContentType } from '../types';
import * as api from '../services/mockApi';
import Spinner from './Spinner';

interface ContentGeneratorProps {
  context: UserContext;
  images: UserImage[];
  onGenerate: (newItems: ContentItem[]) => void;
}

const ContentGenerator: React.FC<ContentGeneratorProps> = ({ context, images, onGenerate }) => {
  const [type, setType] = useState<ContentType>(ContentType.TEXT);
  const [count, setCount] = useState(1);
  const [startImageId, setStartImageId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [veoKeySelected, setVeoKeySelected] = useState(true);

  const isContextEmpty = !context.notes.trim() && !context.links.trim();

  useEffect(() => {
    // Reset start image when type changes to text
    if (type === ContentType.TEXT) {
        setStartImageId('');
    }
  }, [type]);

  useEffect(() => {
    if (type === ContentType.VIDEO) {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        window.aistudio.hasSelectedApiKey().then(hasKey => {
          setVeoKeySelected(hasKey);
        });
      } else {
        // If the aistudio helper is not available, assume we can proceed.
        // This might be the case in local dev outside the specific environment.
        setVeoKeySelected(true); 
      }
    }
  }, [type]);

  const handleSelectVeoKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      // Assume success after dialog opens to avoid race conditions
      setVeoKeySelected(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isContextEmpty) return;

    setIsGenerating(true);
    try {
      const newItems = await api.generateContent(type, context, count, startImageId || undefined);
      onGenerate(newItems);
    } catch (error) {
      console.error("Failed to generate content", error);
      alert(`An error occurred during generation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Generate New Content</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-slate-300 mb-1">
              Content Type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as ContentType)}
              className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value={ContentType.TEXT}>Text</option>
              <option value={ContentType.IMAGE}>Image</option>
              <option value={ContentType.VIDEO}>Video</option>
            </select>
          </div>
          <div>
            <label htmlFor="count" className="block text-sm font-medium text-slate-300 mb-1">
              How many?
            </label>
            <input
              type="number"
              id="count"
              min="1"
              max="5"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value, 10))}
              className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {(type === ContentType.IMAGE || type === ContentType.VIDEO) && (
            <div>
              <label htmlFor="startImage" className="block text-sm font-medium text-slate-300 mb-1">
                Starting Image (Optional)
              </label>
              <select
                id="startImage"
                value={startImageId}
                onChange={(e) => setStartImageId(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-2 focus:ring-blue-500"
                disabled={images.length === 0}
              >
                <option value="">None</option>
                {images.map(img => <option key={img.id} value={img.id}>{img.name}</option>)}
              </select>
            </div>
          )
        }

        {type === ContentType.VIDEO && !veoKeySelected && (
          <div className="border-l-4 border-yellow-500 bg-yellow-500/10 p-4 rounded-r-lg space-y-2">
              <p className="text-yellow-300 text-sm">Video generation with Veo requires selecting an API key.</p>
              <button
                  type="button"
                  onClick={handleSelectVeoKey}
                  className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                  Select API Key
              </button>
              <p className="text-xs text-slate-400">For more information on billing, see <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-300">our documentation</a>.</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isGenerating || (type === ContentType.VIDEO && !veoKeySelected) || isContextEmpty}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isGenerating && <Spinner size="sm" />}
          <span className="ml-2">{isGenerating ? 'Generating...' : '✨ Generate'}</span>
        </button>
        {isContextEmpty && (
            <p className="text-center text-xs text-yellow-400 mt-2">
                Please add some notes or links in 'Your Context' to generate content.
            </p>
        )}
      </form>
    </div>
  );
};

export default ContentGenerator;
