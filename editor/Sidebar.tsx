import React, { useState, useCallback } from 'react';
import type { FileNode, FolderNode, FileType } from './Editor';

// ── File-type icon SVGs ──────────────────────────────────────

function FileIcon({ type }: { type: FileType }): React.ReactElement {
  const color = {
    ts:   '#3178c6',
    js:   '#f1e05a',
    html: '#e34c26',
    css:  '#563d7c',
    md:   '#5a5a6e',
    json: '#cbcb41',
    txt:  '#5a5a6e',
  }[type] ?? '#5a5a6e';

  return (
    <svg
      className="file-item-icon"
      viewBox="0 0 13 13"
      fill="none"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="8" height="11" rx="1" stroke={color} strokeWidth="1.2" />
      <path d="M7 1v3h3" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      {type === 'ts' && (
        <text x="2.5" y="10.5" fontSize="4.5" fontWeight="700" fill={color} fontFamily="monospace">TS</text>
      )}
      {type === 'js' && (
        <text x="2.5" y="10.5" fontSize="4.5" fontWeight="700" fill={color} fontFamily="monospace">JS</text>
      )}
    </svg>
  );
}

function FolderChevron({ open }: { open: boolean }): React.ReactElement {
  return (
    <svg
      className={`folder-icon${open ? '' : ' collapsed'}`}
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 5l3 4 3-4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FolderOpenIcon(): React.ReactElement {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true" style={{ marginRight: 2 }}>
      <path
        d="M1 4a1 1 0 011-1h3l1 1h5a1 1 0 011 1v5a1 1 0 01-1 1H2a1 1 0 01-1-1V4z"
        stroke="currentColor"
        strokeWidth="1.1"
        fill="rgba(0,212,255,0.08)"
      />
    </svg>
  );
}

// ── Type guards ──────────────────────────────────────────────

function isFolder(node: FileNode | FolderNode): node is FolderNode {
  return 'children' in node;
}

function isFile(node: FileNode | FolderNode): node is FileNode {
  return 'type' in node;
}

// ── FileTreeItem ─────────────────────────────────────────────

interface FileTreeItemProps {
  node: FileNode | FolderNode;
  depth: number;
  activeFileId: string;
  onFileOpen: (fileId: string) => void;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  node,
  depth,
  activeFileId,
  onFileOpen,
}) => {
  const [open, setOpen] = useState<boolean>(true);

  const handleFolderClick = useCallback(() => {
    setOpen(v => !v);
  }, []);

  const handleFileClick = useCallback(() => {
    if (isFile(node)) onFileOpen(node.id);
  }, [node, onFileOpen]);

  if (isFolder(node)) {
    return (
      <div className="file-tree-folder">
        <div
          className="folder-header"
          style={{ paddingLeft: `${8 + depth * 12}px` }}
          onClick={handleFolderClick}
          role="button"
          aria-expanded={open}
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleFolderClick(); }}
        >
          <FolderChevron open={open} />
          <FolderOpenIcon />
          <span>{node.name}</span>
        </div>
        {open && (
          <div className="folder-children">
            {node.children.map(child => (
              <FileTreeItem
                key={child.id}
                node={child}
                depth={depth + 1}
                activeFileId={activeFileId}
                onFileOpen={onFileOpen}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const file = node as FileNode;
  const isActive = file.id === activeFileId;

  return (
    <div
      className={`file-item${isActive ? ' active' : ''}`}
      style={{ paddingLeft: `${8 + depth * 12}px` }}
      onClick={handleFileClick}
      role="button"
      tabIndex={0}
      aria-current={isActive ? 'true' : undefined}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleFileClick(); }}
      title={file.name}
    >
      <FileIcon type={file.type} />
      <span className="file-item-name">{file.name}</span>
    </div>
  );
};

// ── Sidebar Component ────────────────────────────────────────

interface SidebarProps {
  tree: FolderNode;
  allFiles: FileNode[];
  activeFileId: string;
  onFileOpen: (fileId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tree,
  activeFileId,
  onFileOpen,
}) => {
  return (
    <aside className="sidebar" role="navigation" aria-label="File explorer">
      <div className="sidebar-header">
        <span className="sidebar-title">Explorer</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <circle cx="6" cy="6" r="5" stroke="var(--text-dim)" strokeWidth="1.2" />
          <path d="M4 6h4M6 4v4" stroke="var(--text-dim)" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
      <nav className="sidebar-tree">
        <FileTreeItem
          node={tree}
          depth={0}
          activeFileId={activeFileId}
          onFileOpen={onFileOpen}
        />
      </nav>
    </aside>
  );
};
