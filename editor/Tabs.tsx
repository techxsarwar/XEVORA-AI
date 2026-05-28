import React, { useCallback } from 'react';
import type { FileNode, FileType, TabEntry } from './Editor';

// ── Tab file-type icon (small inline) ────────────────────────

const FILE_COLORS: Record<FileType, string> = {
  ts:   '#3178c6',
  js:   '#f1e05a',
  html: '#e34c26',
  css:  '#563d7c',
  md:   '#5a5a6e',
  json: '#cbcb41',
  txt:  '#5a5a6e',
};

function TabFileIcon({ type }: { type: FileType }): React.ReactElement {
  return (
    <svg
      className="tab-icon"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <rect x="0.5" y="0.5" width="8" height="11" rx="1" stroke={FILE_COLORS[type]} strokeWidth="1.1" />
      <path d="M6.5 0.5v3h3" stroke={FILE_COLORS[type]} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

// ── Tabs Component ───────────────────────────────────────────

export interface TabsProps {
  tabs: TabEntry[];
  activeTabId: string;
  allFiles: FileNode[];
  onTabClick: (fileId: string) => void;
  onTabClose: (fileId: string, e: React.MouseEvent) => void;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTabId,
  allFiles,
  onTabClick,
  onTabClose,
}) => {
  const getFile = useCallback(
    (fileId: string): FileNode | undefined => allFiles.find(f => f.id === fileId),
    [allFiles]
  );

  const handleAuxClick = useCallback(
    (fileId: string, e: React.MouseEvent) => {
      // Middle-click closes tab
      if (e.button === 1) {
        e.preventDefault();
        onTabClose(fileId, e);
      }
    },
    [onTabClose]
  );

  if (tabs.length === 0) {
    return (
      <div className="tab-bar" role="tablist" aria-label="Open files" />
    );
  }

  return (
    <div className="tab-bar" role="tablist" aria-label="Open files">
      {tabs.map(({ fileId, modified }) => {
        const file = getFile(fileId);
        if (!file) return null;
        const isActive = fileId === activeTabId;

        return (
          <div
            key={fileId}
            className={`tab${isActive ? ' active' : ''}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${fileId}`}
            tabIndex={isActive ? 0 : -1}
            title={file.name}
            onClick={() => onTabClick(fileId)}
            onAuxClick={e => handleAuxClick(fileId, e)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') onTabClick(fileId);
            }}
          >
            <TabFileIcon type={file.type} />
            <span className="tab-label">{file.name}</span>

            {/* Show modified dot OR close button */}
            {modified ? (
              <span
                className="tab-modified-dot"
                title="Unsaved changes"
                aria-label="Unsaved changes"
              />
            ) : (
              <button
                className="tab-close"
                onClick={e => onTabClose(fileId, e)}
                title={`Close ${file.name}`}
                aria-label={`Close ${file.name}`}
                tabIndex={-1}
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                  <path
                    d="M1 1l6 6M7 1L1 7"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
