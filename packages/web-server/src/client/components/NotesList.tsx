import React from 'react';
import { NoteWithPreview } from '../types';

interface NotesListProps {
  notes: NoteWithPreview[];
}

const NotesList: React.FC<NotesListProps> = ({ notes }) => {
  if (notes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📝</div>
        <div className="text-gray-500 text-lg">No notes found</div>
        <div className="text-gray-400 text-sm mt-2">Create some notes to see them here!</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
      {notes.map(note => (
        <div
          key={note.title}
          className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-5 cursor-pointer transition-all duration-300 hover:from-indigo-50 hover:to-purple-50 hover:-translate-y-1 hover:shadow-xl hover:border-indigo-200 group"
        >
          <div className="font-semibold text-gray-800 mb-3 text-lg group-hover:text-indigo-700 transition-colors duration-200">
            📄 {note.title}
          </div>
          <div className="text-gray-600 text-sm leading-relaxed mb-3">
            {note.preview}
          </div>
          {note.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {note.tags.map(tag => (
                <span
                  key={tag}
                  className="bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium border border-indigo-200 hover:from-indigo-200 hover:to-purple-200 transition-all duration-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NotesList;