
import React from 'react';
import type { ContentItem } from '../types';
import ContentCard from './ContentCard';

interface ContentListProps {
  content: ContentItem[];
  onUpdate: (item: ContentItem) => void;
  onDelete: (id: string) => void;
}

const ContentList: React.FC<ContentListProps> = ({ content, onUpdate, onDelete }) => {
  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Generated Content</h2>
      {content.length === 0 ? (
         <p className="text-slate-400 text-center py-4">No content generated yet. Use the form above to create some!</p>
      ) : (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {content.map(item => (
                <ContentCard key={item.id} item={item} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
        </div>
      )}
    </div>
  );
};

export default ContentList;
