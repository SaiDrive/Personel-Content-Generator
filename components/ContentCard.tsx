import React, { useState } from 'react';
import type { ContentItem } from '../types';
import { ContentStatus, ContentType } from '../types';
import Spinner from './Spinner';
import * as api from '../services/mockApi';

interface ContentCardProps {
  item: ContentItem;
  onUpdate: (item: ContentItem) => void;
  onDelete: (id: string) => void;
}

const StatusBadge: React.FC<{ status: ContentStatus }> = ({ status }) => {
  const statusStyles: Record<ContentStatus, string> = {
    [ContentStatus.PENDING]: 'bg-yellow-500/20 text-yellow-300',
    [ContentStatus.APPROVED]: 'bg-green-500/20 text-green-300',
    [ContentStatus.REJECTED]: 'bg-red-500/20 text-red-300',
    [ContentStatus.SCHEDULED]: 'bg-blue-500/20 text-blue-300',
    [ContentStatus.POSTED]: 'bg-purple-500/20 text-purple-300',
    [ContentStatus.GENERATING]: 'bg-gray-500/20 text-gray-300 animate-pulse',
    [ContentStatus.ERROR]: 'bg-red-700/30 text-red-200',
  };

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[status]}`}>
      {status.toUpperCase()}
    </span>
  );
};

const ContentCard: React.FC<ContentCardProps> = ({ item, onUpdate, onDelete }) => {
  const [schedule, setSchedule] = useState(item.schedule ? new Date(item.schedule).toISOString().slice(0, 16) : '');
  const [showScheduler, setShowScheduler] = useState(false);

  const handleStatusChange = async (status: ContentStatus) => {
    try {
        const updatedItem = await api.updateContentStatus(item.id, status);
        onUpdate(updatedItem);
    } catch (error) {
        console.error(`Failed to update status for item ${item.id}`, error);
        alert(`Error: ${error instanceof Error ? error.message : "Could not update status."}`);
    }
  };
  
  const handleScheduleSave = async () => {
    if (!schedule) return;
    try {
        const updatedItem = await api.updateContentSchedule(item.id, new Date(schedule).toISOString());
        onUpdate(updatedItem);
        setShowScheduler(false);
    } catch (error) {
        console.error(`Failed to schedule item ${item.id}`, error);
        alert(`Error: ${error instanceof Error ? error.message : "Could not save schedule."}`);
    }
  };

  const renderContent = () => {
    if (item.status === ContentStatus.GENERATING) {
      return (
        <div className="flex flex-col items-center justify-center h-48 bg-slate-700 rounded-md">
          <Spinner />
          <p className="mt-2 text-sm text-slate-400">Generating content...</p>
          {item.type === ContentType.VIDEO && <p className="text-xs text-slate-500">(Video may take a few minutes)</p>}
        </div>
      );
    }
    switch (item.type) {
      case ContentType.IMAGE:
        return <img src={item.data} alt={item.prompt} className="w-full h-auto rounded-md object-cover bg-slate-900" />;
      case ContentType.VIDEO:
        return (
            <video src={item.data} controls loop autoPlay muted className="w-full h-auto rounded-md bg-slate-900">
                Your browser does not support the video tag.
            </video>
        );
      case ContentType.TEXT:
      default:
        return <p className="text-slate-300 whitespace-pre-wrap p-2">{item.data}</p>;
    }
  };

  return (
    <div className="bg-slate-700/50 p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-2">
        <StatusBadge status={item.status} />
        <button onClick={() => onDelete(item.id)} className="text-slate-400 hover:text-red-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </button>
      </div>
       <p className="text-xs text-slate-400 mb-3 italic">Prompt: "{item.prompt}"</p>
      <div className="mb-4">
        {renderContent()}
      </div>
      
      {item.status === ContentStatus.ERROR && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm p-3 rounded-md mb-4">
            <p className="font-bold">Generation Failed</p>
            <p className="text-xs">{item.errorMessage || "An unknown error occurred."}</p>
        </div>
      )}

      {showScheduler ? (
        <div className="flex items-center gap-2">
            <input type="datetime-local" value={schedule} onChange={e => setSchedule(e.target.value)} className="w-full bg-slate-600 border border-slate-500 rounded-md p-2 text-white text-sm" />
            <button onClick={handleScheduleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-md text-sm">Save</button>
            <button onClick={() => setShowScheduler(false)} className="bg-slate-500 hover:bg-slate-600 text-white font-bold py-2 px-3 rounded-md text-sm">Cancel</button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {item.status !== ContentStatus.GENERATING && item.status !== ContentStatus.ERROR && (
            <>
              <button onClick={() => handleStatusChange(ContentStatus.APPROVED)} className="bg-green-600/50 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-md text-sm transition-colors">Approve</button>
              <button onClick={() => handleStatusChange(ContentStatus.REJECTED)} className="bg-red-600/50 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-md text-sm transition-colors">Reject</button>
              <button onClick={() => setShowScheduler(true)} className="bg-blue-600/50 hover:bg-blue-600 text-white font-semibold py-1 px-3 rounded-md text-sm transition-colors">Schedule</button>
            </>
          )}
        </div>
      )}
      
      {item.schedule && <p className="text-xs text-blue-300 mt-2">Scheduled for: {new Date(item.schedule).toLocaleString()}</p>}
    </div>
  );
};

export default ContentCard;