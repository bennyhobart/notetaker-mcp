import React, { useState, useEffect } from 'react';
import { Note, NoteWithPreview } from '../types';

const NotesView: React.FC = () => {
  const [notes, setNotes] = useState<NoteWithPreview[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notes');
      const result = await response.json();
      if (result.success) {
        const processedNotes = result.data.map((note: any) => {
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
        setNotes(processedNotes);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNoteContent = async (title: string) => {
    try {
      const response = await fetch(`/api/notes/${encodeURIComponent(title)}`);
      const result = await response.json();
      if (result.success) {
        setSelectedNote(result.data);
      }
    } catch (error) {
      console.error('Error loading note content:', error);
    }
  };

  const createNewNote = async () => {
    const title = prompt('Enter note title:');
    if (!title) return;
    
    const content = `---
tags: []
---
# ${title}

Start writing your note here...`;

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, content })
      });
      const result = await response.json();
      if (result.success) {
        loadNotes();
        loadNoteContent(title);
      } else {
        alert('Failed to create note: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Failed to create note: ' + (error as Error).message);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center text-gray-500 py-10">
        Loading notes...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-5 border-b border-gray-200 flex gap-4 items-center flex-wrap">
        <button
          onClick={() => setNotes(notes)}
          className="px-4 py-2 border border-gray-300 rounded-md bg-white cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:border-gray-400"
        >
          All Notes
        </button>
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md flex-1 min-w-48"
        />
        <button
          onClick={createNewNote}
          className="px-4 py-2 border border-gray-300 rounded-md bg-white cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:border-gray-400"
        >
          New Note
        </button>
      </div>

      <div className="grid grid-cols-12 h-96">
        <div className="col-span-4 border-r border-gray-200 overflow-y-auto">
          <h3 className="p-4 m-0 bg-gray-50 border-b border-gray-200 text-base text-gray-800">
            Notes
          </h3>
          <div>
            {filteredNotes.map(note => (
              <div
                key={note.title}
                onClick={() => loadNoteContent(note.title)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors duration-200 hover:bg-gray-50 ${
                  selectedNote?.title === note.title 
                    ? 'bg-blue-50 border-l-2 border-l-blue-500' 
                    : ''
                }`}
              >
                <div className="font-semibold text-gray-800 mb-1">
                  {note.title}
                </div>
                <div className="text-sm text-gray-600 leading-snug">
                  {note.preview}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-8 overflow-y-auto relative">
          {selectedNote ? (
            <div className="p-8 max-w-3xl mx-auto leading-relaxed">
              <NoteContent note={selectedNote} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <h3 className="text-gray-800 mb-2">Welcome to Note Manager</h3>
              <p>Select a note from the list to view its content, or create a new note.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const NoteContent: React.FC<{ note: Note }> = ({ note }) => {
  const lines = note.content.split('\n');
  let contentStart = 0;
  let metadata: any = {};
  
  if (lines[0] === '---') {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === '---') {
        contentStart = i + 1;
        break;
      }
      
      const line = lines[i].trim();
      if (line.includes(':')) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        
        if (key === 'tags' && value.startsWith('[') && value.endsWith(']')) {
          metadata[key] = value.slice(1, -1).split(',')
            .map(t => t.trim().replace(/['"]/g, ''))
            .filter(t => t.length > 0);
        } else {
          metadata[key] = value.replace(/['"]/g, '');
        }
      }
    }
  }
  
  const markdownContent = lines.slice(contentStart).join('\n').trim();
  
  return (
    <>
      {Object.keys(metadata).length > 0 && (
        <div className="bg-gray-50 p-4 rounded-md mb-5 text-sm text-gray-600">
          {metadata.createdAt && (
            <div><strong>Created:</strong> {new Date(metadata.createdAt).toLocaleDateString()}</div>
          )}
          {metadata.updatedAt && (
            <div><strong>Updated:</strong> {new Date(metadata.updatedAt).toLocaleDateString()}</div>
          )}
          {metadata.tags && metadata.tags.length > 0 && (
            <>
              <div><strong>Tags:</strong></div>
              <div className="flex gap-2 flex-wrap mt-2">
                {metadata.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <div 
        className="prose prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(markdownContent) }}
      />
    </>
  );
};

const convertMarkdownToHtml = (markdown: string): string => {
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-700 mt-6 mb-3">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-gray-700 mt-6 mb-3">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-800 border-b-2 border-gray-200 pb-2 mb-5">$1</h1>');
  
  // Bold and italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-4 rounded-md overflow-x-auto border border-gray-200"><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>');
  
  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-gray-300 m-0 p-4 bg-gray-50 italic">$1</blockquote>');
  
  // Line breaks
  html = html.replace(/\n\n/g, '</p><p class="mb-4">');
  html = html.replace(/\n/g, '<br>');
  
  // Wrap in paragraphs
  if (html && !html.startsWith('<')) {
    html = '<p class="mb-4">' + html + '</p>';
  }
  
  return html;
};

export default NotesView;