
import React, { useState } from 'react';
import type { UserContext } from '../types';

interface ContextEditorProps {
  context: UserContext;
  onSave: (context: UserContext) => Promise<void>;
}

const ContextEditor: React.FC<ContextEditorProps> = ({ context, onSave }) => {
  const [notes, setNotes] = useState(context.notes);
  const [links, setLinks] = useState(context.links);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({ notes, links });
    setIsSaving(false);
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Your Context</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1">
            Notes & Ideas
          </label>
          <textarea
            id="notes"
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="E.g., Upcoming product launch, key features, target audience..."
          />
        </div>
        <div>
          <label htmlFor="links" className="block text-sm font-medium text-slate-300 mb-1">
            Reference Links
          </label>
          <textarea
            id="links"
            rows={3}
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="E.g., Competitor analysis, inspiration, brand guidelines..."
          />
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Context'}
        </button>
      </div>
    </div>
  );
};

export default ContextEditor;
