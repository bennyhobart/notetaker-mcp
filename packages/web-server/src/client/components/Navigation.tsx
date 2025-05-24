import React from 'react';
import { ViewMode } from '../types';

interface NavigationProps {
  viewMode: ViewMode;
  onToggleView: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ viewMode, onToggleView }) => {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex rounded-lg bg-white shadow-lg border border-gray-200 p-1">
        <button
          onClick={onToggleView}
          className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
            viewMode === 'visualization' 
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' 
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          🎨 Visualization
        </button>
        <button
          onClick={onToggleView}
          className={`px-6 py-3 rounded-md font-medium transition-all duration-200 ${
            viewMode === 'notes' 
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md' 
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          📝 Notes
        </button>
      </div>
    </div>
  );
};

export default Navigation;