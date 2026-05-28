import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import './editor.css';
import { Sidebar } from './Sidebar';
import { Tabs } from './Tabs';
import { StatusBar } from './StatusBar';

// ── Types ────────────────────────────────────────────────────

export type FileType = 'html' | 'ts' | 'css' | 'md' | 'json' | 'js' | 'txt';

export interface FileNode {
  id: string;
  name: string;
  type: FileType;
  content: string;
}

export interface FolderNode {
  id: string;
  name: string;
  children: (FileNode | FolderNode)[];
}

export interface TabEntry {
  fileId: string;
  modified: boolean;
}

// ── Syntax Highlighting ──────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function highlightTypeScript(code: string): string {
  const keywords = /\b(import|export|from|async|await|function|const|let|var|return|new|class|interface|type|extends|implements|if|else|for|while|switch|case|break|continue|throw|try|catch|finally|void|null|undefined|true|false|default|of|in|typeof|instanceof|as|declare|enum|namespace|abstract|override|readonly|public|private|protected|static|get|set|yield|super|this)\b/g;
  const types = /\b(string|number|boolean|any|never|unknown|object|symbol|bigint|Promise|Array|Record|Partial|Required|Readonly|Pick|Omit|Map|Set|WeakMap|WeakSet|Event|Element|HTMLElement|Document|Window|Error)\b/g;
  const strings = /(["'`])(?:(?!\1)[^\\]|\\[\s\S])*?\1/g;
  const comments = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g;
  const numbers = /\b(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g;
  const functions = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g;

  // Use placeholder tokens to avoid re-processing
  const placeholders: string[] = [];
  let idx = 0;

  const placeholder = (html: string): string => {
    const id = `\x00${idx++}\x00`;
    placeholders.push(html);
    return id;
  };

  let result = escapeHtml(code);

  // Comments first (highest priority)
  result = result.replace(
    /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)/g,
    (m) => placeholder(`<span class="token comment">${m}</span>`)
  );

  // Strings
  result = result.replace(
    /(&#34;(?:[^&#34;\\]|\\.)*&#34;|&#39;(?:[^&#39;\\]|\\.)*&#39;|`(?:[^`\\]|\\.)*`|&quot;(?:[^&quot;\\]|\\.)*&quot;)/g,
    (m) => placeholder(`<span class="token string">${m}</span>`)
  );

  // Keywords
  result = result.replace(
    /\b(import|export|from|async|await|function|const|let|var|return|new|class|interface|type|extends|implements|if|else|for|while|switch|case|break|continue|throw|try|catch|finally|void|null|undefined|true|false|default|of|in|typeof|instanceof|as|declare|enum|namespace|abstract|override|readonly|public|private|protected|static|get|set|yield|super|this)\b/g,
    (m) => placeholder(`<span class="token keyword">${m}</span>`)
  );

  // Built-in types
  result = result.replace(
    /\b(string|number|boolean|any|never|unknown|object|symbol|bigint|Promise|Array|Record|Partial|Required|Readonly|Pick|Omit|Map|Set|WeakMap|WeakSet|Error)\b/g,
    (m) => placeholder(`<span class="token type">${m}</span>`)
  );

  // Numbers
  result = result.replace(
    /\b(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/g,
    (m) => placeholder(`<span class="token number">${m}</span>`)
  );

  // Function names before (
  result = result.replace(
    /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g,
    (m, name) => {
      const kwds = new Set(['if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'typeof', 'instanceof', 'new']);
      if (kwds.has(name)) return m;
      return placeholder(`<span class="token function">${name}</span>`) + m.slice(name.length);
    }
  );

  // Operators and punctuation
  result = result.replace(
    /([{}[\]();,.:=<>!?+\-*/%|&^~])/g,
    (m) => {
      const ops = new Set(['=>', '===', '!==', '==', '!=', '>=', '<=', '&&', '||', '??', '?.']);
      return placeholder(`<span class="token punctuation">${m}</span>`);
    }
  );

  // Restore placeholders
  placeholders.forEach((html, i) => {
    result = result.replace(`\x00${i}\x00`, html);
  });

  return result;
}

function highlightCSS(code: string): string {
  let result = escapeHtml(code);
  result = result.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="token comment">$1</span>');
  result = result.replace(/(#[0-9a-fA-F]{3,8})\b/g, '<span class="token number">$1</span>');
  result = result.replace(/\b(\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|ms|deg)?)\b/g, '<span class="token number">$1</span>');
  result = result.replace(/(--[\w-]+)/g, '<span class="token variable">$1</span>');
  result = result.replace(/(["'])([^"']*)\1/g, '<span class="token string">$1$2$1</span>');
  result = result.replace(/([.#:@][\w-]+)/g, '<span class="token keyword">$1</span>');
  result = result.replace(/\b(color|background|font|margin|padding|border|display|flex|width|height|position|top|left|right|bottom|overflow|cursor|transition|animation|opacity|transform|content|gap|grid|align|justify)\b/g, '<span class="token function">$1</span>');
  return result;
}

function highlightMarkdown(code: string): string {
  let result = escapeHtml(code);
  result = result.replace(/^(#{1,6}\s.*)$/gm, '<span class="token keyword">$1</span>');
  result = result.replace(/(`[^`]+`)/g, '<span class="token string">$1</span>');
  result = result.replace(/(```[\s\S]*?```)/g, '<span class="token string">$1</span>');
  result = result.replace(/(\*\*[^*]+\*\*)/g, '<span class="token type">$1</span>');
  result = result.replace(/(\*[^*]+\*)/g, '<span class="token comment">$1</span>');
  result = result.replace(/^(-\s.*|>\s.*)$/gm, '<span class="token variable">$1</span>');
  return result;
}

function highlightHtml(code: string): string {
  let result = escapeHtml(code);
  result = result.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="token comment">$1</span>');
  result = result.replace(/(&lt;\/?)([\w-]+)/g, '<span class="token punctuation">$1</span><span class="token keyword">$2</span>');
  result = result.replace(/([\w-]+)(=)(&quot;[^&]*&quot;)/g, '<span class="token function">$1</span><span class="token operator">$2</span><span class="token string">$3</span>');
  result = result.replace(/(&gt;)/g, '<span class="token punctuation">$1</span>');
  return result;
}

function getHighlighter(fileType: FileType): (code: string) => string {
  switch (fileType) {
    case 'ts':
    case 'js':
      return highlightTypeScript;
    case 'css':
      return highlightCSS;
    case 'md':
      return highlightMarkdown;
    case 'html':
      return highlightHtml;
    default:
      return escapeHtml;
  }
}

// ── Sample Files ─────────────────────────────────────────────

const INITIAL_FILES: FileNode[] = [
  {
    id: 'index.html',
    name: 'index.html',
    type: 'html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xevora AI</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app"></div>
  <script src="app.js"></script>
</body>
</html>`,
  },
  {
    id: 'app.ts',
    name: 'app.ts',
    type: 'ts',
    content: `import { parseAIOutput } from './parser';

interface AIResponse {
  files: ParsedFile[];
  hasHTML: boolean;
  hasCSS: boolean;
  hasJS: boolean;
}

async function fetchAIResponse(): Promise<string> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'Build a dashboard' }),
  });
  const data = await response.json();
  return data.content;
}

async function run(): Promise<void> {
  const raw = await fetchAIResponse();
  const result = parseAIOutput(raw);
  console.log(result.files);
  console.log(\`Found \${result.files.length} files\`);
}

run().catch(console.error);
`,
  },
  {
    id: 'parser.ts',
    name: 'parser.ts',
    type: 'ts',
    content: `export interface ParsedFile {
  filename: string;
  language: string;
  content: string;
}

export interface ParseResult {
  files: ParsedFile[];
  hasHTML: boolean;
  hasCSS: boolean;
  hasJS: boolean;
}

const FENCE_REGEX =
  /\`\`\`(\\w+)(?:\\s+filename=["']([^"']+)["'])?\\s*\\n([\\s\\S]*?)\`\`\`/gi;

export function parseAIOutput(rawMarkdown: string): ParseResult {
  const files: ParsedFile[] = [];
  let match: RegExpExecArray | null;

  FENCE_REGEX.lastIndex = 0;
  while ((match = FENCE_REGEX.exec(rawMarkdown)) !== null) {
    const lang = match[1].toLowerCase();
    const filename = match[2] ?? \`output.\${lang}\`;
    const content = match[3].trimEnd();
    if (content.trim()) files.push({ filename, language: lang, content });
  }

  return {
    files,
    hasHTML: files.some(f => f.filename.endsWith('.html')),
    hasCSS:  files.some(f => f.filename.endsWith('.css')),
    hasJS:   files.some(f => f.filename.endsWith('.js') || f.filename.endsWith('.ts')),
  };
}
`,
  },
  {
    id: 'styles.css',
    name: 'styles.css',
    type: 'css',
    content: `:root {
  --bg:       #0e0e10;
  --surface:  #141416;
  --accent:   #00d4ff;
  --text:     #e8e8ed;
  --muted:    #5a5a6e;
  --border:   #222226;
  --radius:   4px;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}
`,
  },
  {
    id: 'README.md',
    name: 'README.md',
    type: 'md',
    content: `# Xevora AI

> High-precision multi-model AI coding engine with instant live preview.

## Features

- **Multi-Model Matrix** — automatic failover routing across providers
- **Modular Code Generation** — named \`filename=\` fenced code blocks
- **Live Sandbox Preview** — instant iframe compilation
- **Export ZIP** — package all files with one click

## Quick Start

\`\`\`bash
git clone https://github.com/techxsarwar/XEVORA-AI.git
cd XEVORA-AI
npm install
npm run dev
\`\`\`

## Tech Stack

- TypeScript + Vite
- Vanilla CSS
- OpenRouter API (Fallback Matrix)

---

*Designed for builders.*
`,
  },
];

const INITIAL_TREE: FolderNode = {
  id: 'root',
  name: 'XEVORA-AI',
  children: [
    {
      id: 'src-folder',
      name: 'src',
      children: INITIAL_FILES.slice(0, 3) as FileNode[],
    },
    INITIAL_FILES[3] as FileNode,
    INITIAL_FILES[4] as FileNode,
  ],
};

// ── Output Panel data ────────────────────────────────────────

interface OutputLine {
  prefix: string;
  text: string;
  status?: 'success' | 'error' | 'normal';
}

const SAMPLE_OUTPUT: OutputLine[] = [
  { prefix: '›', text: 'xv build --matrix', status: 'normal' },
  { prefix: ' ', text: '[OK] TypeScript compiled — 0 errors', status: 'success' },
  { prefix: ' ', text: '[OK] Parsing AI output blocks...', status: 'success' },
  { prefix: ' ', text: '   Found 3 files: index.html, styles.css, app.js', status: 'normal' },
  { prefix: ' ', text: '[OK] Assembling preview srcdoc...', status: 'success' },
  { prefix: ' ', text: '[OK] Preview loaded in sandbox frame', status: 'success' },
  { prefix: ' ', text: '', status: 'normal' },
  { prefix: '›', text: 'Waiting for next prompt...', status: 'normal' },
];

// ── Editor Component ─────────────────────────────────────────

export interface EditorProps {
  initialActiveFileId?: string;
}

export const Editor: React.FC<EditorProps> = ({
  initialActiveFileId = 'app.ts',
}) => {
  const [fileTree] = useState<FolderNode>(INITIAL_TREE);
  const [allFiles] = useState<FileNode[]>(INITIAL_FILES);

  const [tabs, setTabs] = useState<TabEntry[]>([
    { fileId: 'index.html', modified: false },
    { fileId: 'app.ts', modified: false },
    { fileId: 'parser.ts', modified: true },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>(initialActiveFileId);

  const [fileContents, setFileContents] = useState<Record<string, string>>(
    () => Object.fromEntries(INITIAL_FILES.map(f => [f.id, f.content]))
  );

  const [cursorLine, setCursorLine] = useState<number>(1);
  const [cursorCol, setCursorCol] = useState<number>(1);

  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(true);
  const [rightPanelTab, setRightPanelTab] = useState<'output' | 'preview'>('output');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeFile = useMemo<FileNode | undefined>(
    () => allFiles.find(f => f.id === activeTabId),
    [allFiles, activeTabId]
  );

  const activeContent = activeFile ? (fileContents[activeFile.id] ?? activeFile.content) : '';

  const highlighted = useMemo<string>(() => {
    if (!activeFile) return '';
    return getHighlighter(activeFile.type)(activeContent);
  }, [activeFile, activeContent]);

  const lines = useMemo<string[]>(
    () => activeContent.split('\n'),
    [activeContent]
  );

  const activeLine = cursorLine;

  // ── Handlers ────────────────────────────────────────────────

  const handleFileOpen = useCallback((fileId: string) => {
    setActiveTabId(fileId);
    setTabs(prev => {
      const exists = prev.some(t => t.fileId === fileId);
      if (exists) return prev;
      return [...prev, { fileId, modified: false }];
    });
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const handleTabClose = useCallback((fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTabs(prev => {
      const next = prev.filter(t => t.fileId !== fileId);
      if (activeTabId === fileId && next.length > 0) {
        const idx = prev.findIndex(t => t.fileId === fileId);
        const newActive = next[Math.min(idx, next.length - 1)].fileId;
        setActiveTabId(newActive);
      }
      return next;
    });
  }, [activeTabId]);

  const handleTabClick = useCallback((fileId: string) => {
    setActiveTabId(fileId);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (!activeFile) return;
    setFileContents(prev => ({ ...prev, [activeFile.id]: val }));
    setTabs(prev =>
      prev.map(t => t.fileId === activeFile.id ? { ...t, modified: true } : t)
    );
  }, [activeFile]);

  const handleCursorMove = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    const text = ta.value.substring(0, ta.selectionStart);
    const lineNum = (text.match(/\n/g) ?? []).length + 1;
    const lastNewline = text.lastIndexOf('\n');
    const colNum = lastNewline === -1 ? ta.selectionStart + 1 : ta.selectionStart - lastNewline;
    setCursorLine(lineNum);
    setCursorCol(colNum);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const val = ta.value;
      const newVal = val.substring(0, start) + '  ' + val.substring(end);
      if (activeFile) {
        setFileContents(prev => ({ ...prev, [activeFile.id]: newVal }));
      }
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  }, [activeFile]);

  // Active line top offset (1-indexed)
  const activeLineTop = (activeLine - 1) * 22 + 16; // 16px = padding-top of code-editor-wrap

  const activeLineRef = useRef<HTMLDivElement>(null);

  const fileType = activeFile?.type ?? 'txt';

  const fileLabel = useMemo<string>(() => {
    const map: Record<FileType, string> = {
      ts: 'TypeScript', js: 'JavaScript', html: 'HTML', css: 'CSS',
      md: 'Markdown', json: 'JSON', txt: 'Text',
    };
    return map[fileType] ?? 'Text';
  }, [fileType]);

  return (
    <div className="editor-root">
      <div className="editor-body">
        {/* ── Sidebar ── */}
        <Sidebar
          tree={INITIAL_TREE}
          allFiles={allFiles}
          activeFileId={activeTabId}
          onFileOpen={handleFileOpen}
        />

        {/* ── Main editor area ── */}
        <div className="editor-main">
          <Tabs
            tabs={tabs}
            activeTabId={activeTabId}
            allFiles={allFiles}
            onTabClick={handleTabClick}
            onTabClose={handleTabClose}
          />

          <div className="editor-code-area">
            {activeFile ? (
              <>
                {/* Line numbers */}
                <div className="line-numbers" aria-hidden="true">
                  {lines.map((_, i) => (
                    <div
                      key={i}
                      className={`line-number${i + 1 === activeLine ? ' current' : ''}`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* Code + textarea overlay */}
                <div className="code-editor-wrap" id="code-editor-wrap">
                  {/* Active line highlight */}
                  <div
                    ref={activeLineRef}
                    className="active-line-highlight"
                    style={{ top: activeLineTop }}
                  />

                  {/* Highlighted code */}
                  <div className="code-highlight">
                    <pre
                      aria-hidden="true"
                      dangerouslySetInnerHTML={{ __html: highlighted }}
                    />
                  </div>

                  {/* Editable textarea */}
                  <textarea
                    ref={textareaRef}
                    className="code-textarea"
                    value={activeContent}
                    onChange={handleCodeChange}
                    onKeyDown={handleKeyDown}
                    onClick={handleCursorMove}
                    onKeyUp={handleCursorMove}
                    onSelect={handleCursorMove}
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                    aria-label={`Edit ${activeFile.name}`}
                  />
                </div>

                {/* Right panel toggle edge button */}
                <button
                  className="panel-toggle-edge"
                  onClick={() => setRightPanelOpen(v => !v)}
                  title={rightPanelOpen ? 'Collapse output panel' : 'Expand output panel'}
                  aria-label={rightPanelOpen ? 'Collapse output panel' : 'Expand output panel'}
                >
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                    <path
                      d={rightPanelOpen ? 'M2 2l4 4-4 4' : 'M6 2L2 6l4 4'}
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <div className="editor-empty">No file open</div>
            )}
          </div>
        </div>

        {/* ── Right output panel ── */}
        <div className={`right-panel${rightPanelOpen ? '' : ' collapsed'}`}>
          <div className="right-panel-header">
            <span className="right-panel-title">Output</span>
            <button
              className="panel-collapse-btn"
              onClick={() => setRightPanelOpen(v => !v)}
              title="Collapse"
              aria-label="Collapse output panel"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path
                  d="M1 1l6 6M7 1L1 7"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <div className="right-panel-body">
            <div className="right-panel-tabs">
              <button
                className={`right-panel-tab${rightPanelTab === 'output' ? ' active' : ''}`}
                onClick={() => setRightPanelTab('output')}
              >
                Terminal
              </button>
              <button
                className={`right-panel-tab${rightPanelTab === 'preview' ? ' active' : ''}`}
                onClick={() => setRightPanelTab('preview')}
              >
                Preview
              </button>
            </div>

            {rightPanelTab === 'output' ? (
              <div className="output-block">
                {SAMPLE_OUTPUT.map((line, i) => (
                  <div key={i} className="output-line">
                    <span className="output-line-prefix">{line.prefix}</span>
                    <span className={`output-line-text${line.status && line.status !== 'normal' ? ` ${line.status}` : ''}`}>
                      {line.text}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="output-block" style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-ui)' }}>
                  No preview available
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Status bar ── */}
      <StatusBar
        branch="main"
        line={cursorLine}
        col={cursorCol}
        fileType={fileLabel}
        encoding="UTF-8"
        indent="2 spaces"
        model={
          activeTabId === 'app.ts' ? 'qwen-2.5-coder-32b' : 'llama-3.3-70b'
        }
      />
    </div>
  );
};
