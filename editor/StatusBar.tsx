import React from 'react';

// ── StatusBar ────────────────────────────────────────────────

export interface StatusBarProps {
  branch:   string;
  line:     number;
  col:      number;
  fileType: string;
  encoding: string;
  indent:   string;
  model:    string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  branch,
  line,
  col,
  fileType,
  encoding,
  indent,
  model,
}) => {
  return (
    <footer
      className="status-bar"
      role="contentinfo"
      aria-label="Editor status bar"
    >
      {/* ── Left side ── */}
      <div className="status-left">
        {/* Git branch */}
        <div className="status-item" title={`Git branch: ${branch}`}>
          <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="3" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.1" />
            <circle cx="9" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.1" />
            <circle cx="3" cy="9" r="1.5" stroke="currentColor" strokeWidth="1.1" />
            <path d="M3 4.5V7.5M4.5 3h3M4.5 3C4.5 6 9 5 9 4.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          <span>{branch}</span>
        </div>

        {/* Error count (0) */}
        <div className="status-item" title="No errors or warnings">
          <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.1" />
            <path d="M4 4l4 4M8 4l-4 4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          <span>0</span>
          <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ marginLeft: 4 }}>
            <path d="M6 2v5M6 8.5v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.1" />
          </svg>
          <span>0</span>
        </div>

        {/* AI model badge */}
        <div className="status-item accent" title={`Active AI model: ${model}`}>
          <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="2" fill="currentColor" />
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.1" strokeDasharray="2 1.5" />
          </svg>
          <span>{model}</span>
        </div>
      </div>

      {/* ── Right side ── */}
      <div className="status-right">
        {/* Indent */}
        <div className="status-item" title={`Indentation: ${indent}`}>
          <span>{indent}</span>
        </div>

        {/* Encoding */}
        <div className="status-item" title={`File encoding: ${encoding}`}>
          <span>{encoding}</span>
        </div>

        {/* File type */}
        <div className="status-item" title={`Language: ${fileType}`}>
          <span>{fileType}</span>
        </div>

        {/* Cursor position */}
        <div
          className="status-item"
          title={`Cursor position — Ln ${line}, Col ${col}`}
          aria-live="polite"
          aria-atomic="true"
        >
          <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.1" />
            <path d="M4 4h4M4 6h3M4 8h2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          <span>Ln {line}, Col {col}</span>
        </div>

        {/* Layout indicator */}
        <div className="status-item" title="Editor layout: 3 columns">
          <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <rect x="0.5" y="0.5" width="3" height="11" rx="0.5" stroke="currentColor" strokeWidth="1" />
            <rect x="4.5" y="0.5" width="3" height="11" rx="0.5" stroke="currentColor" strokeWidth="1" />
            <rect x="8.5" y="0.5" width="3" height="11" rx="0.5" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
      </div>
    </footer>
  );
};
