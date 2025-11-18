import React, { useState, useEffect, useCallback } from 'react';
import type { UserContext, UserImage, ContentItem, ContentType, ContentStatus } from '../types';
import * as api from '../services/mockApi';
import ContextEditor from './ContextEditor';
import ImageLibrary from './ImageLibrary';
import ContentGenerator from './ContentGenerator';
import ContentList from './ContentList';
import Spinner from './Spinner';

const Dashboard: React.FC = () => {
  const [context, setContext] = useState<UserContext | null>(null);
  const [images, setImages] = useState<UserImage[] | null>(null);
  const [content, setContent] = useState<ContentItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [contextData, imagesData, contentData] = await Promise.all([
        api.getContext(),
        api.getImages(),
        api.getContent(),
      ]);
      setContext(contextData);
      setImages(imagesData);
      setContent(contentData);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Poll for updates on 'generating' items
  useEffect(() => {
    const hasGeneratingItems = content?.some(item => item.status === 'generating');
    if (!hasGeneratingItems) return;

    const interval = setInterval(async () => {
      try {
        const fetchedContent = await api.getContent();
        setContent(prevContent => {
            if (!prevContent) return fetchedContent;
            
            const fetchedContentMap = new Map(fetchedContent.map(item => [item.id, item]));
            
            // Update existing items from the fetched data, but preserve any new items
            // that are in our current state but may not have been saved to the DB yet.
            return prevContent.map(
                prevItem => fetchedContentMap.get(prevItem.id) || prevItem
            );
        });
      } catch (err) {
        console.error("Failed to poll for content updates", err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [content]);

  const handleContextSave = async (newContext: UserContext) => {
    await api.saveContext(newContext);
    setContext(newContext);
  };
  
  const handleImageUpload = (newImage: UserImage) => {
      setImages(prev => (prev ? [newImage, ...prev] : [newImage]));
  };

  const handleImageDelete = async (id: string) => {
    await api.deleteImage(id);
    setImages(prev => prev?.filter(img => img.id !== id) || null);
  };
  
  const handleContentGenerate = (newItems: ContentItem[]) => {
      setContent(prev => (prev ? [...newItems, ...prev] : newItems));
  };

  const handleContentUpdate = (updatedItem: ContentItem) => {
    setContent(prev => prev?.map(item => item.id === updatedItem.id ? updatedItem : item) || null);
  };

  const handleContentDelete = async (id: string) => {
    await api.deleteContent(id);
    setContent(prev => prev?.filter(item => item.id !== id) || null);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <Spinner />
      </div>
    );
  }

  if (error) {
      return (
          <div className="flex flex-col justify-center items-center h-[calc(100vh-4rem)] text-center text-red-400">
              <h2 className="text-2xl font-bold mb-2">Failed to load Dashboard</h2>
              <p>{error}</p>
              <button onClick={fetchData} className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">
                  Try Again
              </button>
          </div>
      );
  }

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-8">
          {context && <ContextEditor context={context} onSave={handleContextSave} />}
          {images && <ImageLibrary images={images} onImageUpload={handleImageUpload} onImageDelete={handleImageDelete}/>}
        </div>
        <div className="lg:col-span-2 flex flex-col gap-8">
          {context && images && <ContentGenerator context={context} images={images} onGenerate={handleContentGenerate} />}
          {content && <ContentList 
            content={content} 
            onUpdate={handleContentUpdate} 
            onDelete={handleContentDelete}
          />}
        </div>
      </div>
    </main>
  );
};

export default Dashboard;