import React from 'react';
import { VisualizationData } from '../types';

interface TagCloudProps {
  visualizationData: VisualizationData | null;
  selectedTags: Set<string>;
  onToggleTag: (tagName: string) => void;
}

const TagCloud: React.FC<TagCloudProps> = ({
  visualizationData,
  selectedTags,
  onToggleTag
}) => {
  if (!visualizationData) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-2">🏷️</div>
          <div className="text-indigo-500 font-medium">Loading tags...</div>
        </div>
      </div>
    );
  }

  if (visualizationData.tags.length === 0) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">🏷️</div>
          <div className="text-gray-500 font-medium">No tags found</div>
          <div className="text-gray-400 text-sm mt-1">Add tags to your notes to see them here!</div>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...visualizationData.tags.map(t => t.count));

  return (
    <div className="min-h-96 flex flex-wrap items-center justify-center gap-2.5">
      {visualizationData.tags.map(tag => {
        const fontSize = 12 + (tag.count / maxCount) * 12;
        const isSelected = selectedTags.has(tag.name);
        
        return (
          <button
            key={tag.name}
            onClick={() => onToggleTag(tag.name)}
            className={`
              px-4 py-3 rounded-full border-none font-medium transition-all duration-300 cursor-pointer shadow-md
              ${isSelected 
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white transform scale-105 shadow-pink-200' 
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:scale-110 hover:shadow-xl hover:from-indigo-600 hover:to-purple-700'
              }
            `}
            style={{ fontSize: `${fontSize}px` }}
          >
            {tag.name} ({tag.count})
          </button>
        );
      })}
    </div>
  );
};

export default TagCloud;