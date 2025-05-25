import React, { useState, useEffect } from "react";

interface LinksPanelProps {
  noteTitle: string;
  onNavigateToNote: (noteTitle: string) => void;
}

interface LinkData {
  outgoingLinks: string[];
  backlinks: string[];
}

const LinksPanel: React.FC<LinksPanelProps> = ({ noteTitle, onNavigateToNote }): JSX.Element => {
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLinkData();
  }, [noteTitle]);

  const loadLinkData = async (): Promise<void> => {
    if (!noteTitle) return;

    try {
      setLoading(true);
      const [outgoingResponse, backlinksResponse] = await Promise.all([
        fetch(`/api/notes/${encodeURIComponent(noteTitle)}/outgoing`),
        fetch(`/api/notes/${encodeURIComponent(noteTitle)}/backlinks`),
      ]);

      const outgoingResult = await outgoingResponse.json();
      const backlinksResult = await backlinksResponse.json();

      if (outgoingResult.success && backlinksResult.success) {
        setLinkData({
          outgoingLinks: outgoingResult.data,
          backlinks: backlinksResult.data,
        });
      }
    } catch (error) {
      console.error("Error loading link data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">Loading links...</div>
      </div>
    );
  }

  if (!linkData) {
    return null;
  }

  const hasLinks = linkData.outgoingLinks.length > 0 || linkData.backlinks.length > 0;

  if (!hasLinks) {
    return null;
  }

  return (
    <div className="p-4 border-t border-gray-200 bg-gray-50">
      <div className="space-y-4">
        {/* Outgoing Links */}
        {linkData.outgoingLinks.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              📎 Linked Notes ({linkData.outgoingLinks.length})
            </h4>
            <div className="space-y-1">
              {linkData.outgoingLinks.map((link) => (
                <button
                  key={link}
                  onClick={() => onNavigateToNote(link)}
                  className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                >
                  → {link}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Backlinks */}
        {linkData.backlinks.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              🔗 Backlinks ({linkData.backlinks.length})
            </h4>
            <div className="space-y-1">
              {linkData.backlinks.map((link) => (
                <button
                  key={link}
                  onClick={() => onNavigateToNote(link)}
                  className="block w-full text-left text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-2 py-1 rounded transition-colors"
                >
                  ← {link}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinksPanel;
