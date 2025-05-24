import React from 'react';
import { VisualizationData, NoteWithPreview } from '../types';
import TagCloud from './TagCloud';
import NetworkGraph from './NetworkGraph';
import NotesList from './NotesList';

interface VisualizationViewProps {
  visualizationData: VisualizationData | null;
  allNotes: NoteWithPreview[];
  selectedTags: Set<string>;
  onToggleTag: (tagName: string) => void;
  onClearSelection: () => void;
  onRefresh: () => void;
}

const VisualizationView: React.FC<VisualizationViewProps> = ({
  visualizationData,
  allNotes,
  selectedTags,
  onToggleTag,
  onClearSelection,
  onRefresh
}) => {
  const filteredNotes = selectedTags.size === 0 
    ? allNotes 
    : allNotes.filter(note => 
        Array.from(selectedTags).every(tag => note.tags.includes(tag))
      );

  return (
    <>
      <div className="flex gap-4 items-center mb-6 flex-wrap">
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium transition-all duration-200 hover:from-emerald-600 hover:to-teal-700 hover:shadow-lg transform hover:-translate-y-0.5"
        >
          🔄 Refresh Data
        </button>
        <button
          onClick={onClearSelection}
          className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg font-medium transition-all duration-200 hover:from-rose-600 hover:to-pink-700 hover:shadow-lg transform hover:-translate-y-0.5"
        >
          ✨ Clear Selection
        </button>
        <div className="bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100">
          <span className="text-gray-700 text-sm font-medium">
            {visualizationData 
              ? `📊 ${visualizationData.tags.length} tags • 📝 ${visualizationData.totalNotes} notes • 🔗 ${visualizationData.connections.length} connections`
              : '⏳ Loading...'
            }
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <h2 className="mt-0 text-gray-800 text-xl font-semibold mb-6 flex items-center gap-2">🏷️ Tag Cloud</h2>
          <TagCloud
            visualizationData={visualizationData}
            selectedTags={selectedTags}
            onToggleTag={onToggleTag}
          />
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <h2 className="mt-0 text-gray-800 text-xl font-semibold mb-6 flex items-center gap-2">🕸️ Tag Network</h2>
          <NetworkGraph
            visualizationData={visualizationData}
            selectedTags={selectedTags}
            onToggleTag={onToggleTag}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 col-span-full">
        <h2 className="mt-0 text-gray-800 text-xl font-semibold mb-6 flex items-center gap-2">
          📚 Notes {selectedTags.size > 0 && (
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              filtered by: {Array.from(selectedTags).join(', ')}
            </span>
          )}
        </h2>
        <NotesList notes={filteredNotes} />
      </div>
    </>
  );
};

export default VisualizationView;