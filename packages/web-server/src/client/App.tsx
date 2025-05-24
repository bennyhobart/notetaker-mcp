import React, { useState, useEffect } from 'react';
import { ViewMode, VisualizationData, NoteWithPreview } from './types';
import VisualizationView from './components/VisualizationView';
import NotesView from './components/NotesView';
import Navigation from './components/Navigation';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('visualization');
  const [visualizationData, setVisualizationData] = useState<VisualizationData | null>(null);
  const [allNotes, setAllNotes] = useState<NoteWithPreview[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vizData, notesData] = await Promise.all([
        fetchVisualizationData(),
        fetchNotes()
      ]);
      setVisualizationData(vizData);
      setAllNotes(notesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisualizationData = async (): Promise<VisualizationData> => {
    const response = await fetch('/api/visualization/tags');
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch visualization data');
    }
    return result.data;
  };

  const fetchNotes = async (): Promise<NoteWithPreview[]> => {
    const response = await fetch('/api/notes');
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch notes');
    }
    
    return result.data.map((note: any) => {
      const lines = note.content.split('\n');
      let contentStart = 0;
      
      if (lines[0] === '---') {
        for (let i = 1; i < lines.length; i++) {
          if (lines[i] === '---') {
            contentStart = i + 1;
            break;
          }
        }
      }
      
      const contentText = lines.slice(contentStart).join('\n').trim();
      const preview = contentText.length > 100 ? 
        contentText.substring(0, 100) + '...' : 
        contentText;
      
      let tags: string[] = [];
      if (lines[0] === '---') {
        const frontmatterLines = lines.slice(1, contentStart - 1);
        for (const line of frontmatterLines) {
          if (line.trim().startsWith('tags:')) {
            const tagLine = line.substring(line.indexOf(':') + 1).trim();
            if (tagLine.startsWith('[') && tagLine.endsWith(']')) {
              tags = tagLine.slice(1, -1).split(',')
                .map(t => t.trim().replace(/['"]/g, ''))
                .filter(t => t.length > 0);
            }
            break;
          }
        }
      }
      
      return {
        title: note.title,
        preview: preview,
        tags: tags
      };
    });
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'visualization' ? 'notes' : 'visualization');
  };

  const toggleTag = (tagName: string) => {
    const newSelectedTags = new Set(selectedTags);
    if (newSelectedTags.has(tagName)) {
      newSelectedTags.delete(tagName);
    } else {
      newSelectedTags.add(tagName);
    }
    setSelectedTags(newSelectedTags);
  };

  const clearSelection = () => {
    setSelectedTags(new Set());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-indigo-600 text-lg font-medium">Loading your notes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-5">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-8">
          📝 Note Manager
        </h1>
        
        <Navigation 
          viewMode={viewMode} 
          onToggleView={toggleViewMode} 
        />
        
        {viewMode === 'visualization' ? (
          <VisualizationView
            visualizationData={visualizationData}
            allNotes={allNotes}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            onClearSelection={clearSelection}
            onRefresh={loadData}
          />
        ) : (
          <NotesView />
        )}
      </div>
    </div>
  );
}

export default App;