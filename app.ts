// ============================================================
// Xevora AI — Claude Code Design System (TypeScript)
// Terminal-dark. Monospace-first. Pure utility.
// ============================================================

import { OutputManager } from "./outputManager";

// ── Types ────────────────────────────────────────────────────
interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatState {
    messages: Message[];
    isLoading: boolean;
    conversationHistory: { role: string; content: string }[];
}

const AI_PROVIDERS = [
    {
        name: "Llama 3.3 70B (OpenRouter)",
        model: "meta-llama/llama-3.3-70b-instruct",
        key: import.meta.env.VITE_OPENROUTER_API_KEY,
        url: "https://openrouter.ai/api/v1/chat/completions"
    },
    {
        name: "Qwen Coder 32B (OpenRouter)",
        model: "qwen/qwen-2.5-coder-32b-instruct",
        key: import.meta.env.VITE_OPENROUTER_API_KEY,
        url: "https://openrouter.ai/api/v1/chat/completions"
    },
    {
        name: "Qwen3 Max (Mule Router)",
        model: "qwen3-max",
        key: import.meta.env.VITE_MULE_ROUTER_API_KEY || import.meta.env.VITE_OPENROUTER_API_KEY,
        url: "/api/mulerouter/vendors/openai/v1/chat/completions"
    }
];

let currentProviderIndex = 0;
function getActiveProvider() {
    return AI_PROVIDERS[currentProviderIndex];
}

const SYSTEM_PROMPT = `You are Xevora AI — an elite full-stack engineer and UI designer.
You write production-ready code that is clean, modern, and fully functional.

## Code Output Format (STRICT — always follow)

When generating web projects, you MUST split your output into separate, named files.
Never output a single monolithic HTML file with embedded <style> or <script> tags.

Use this exact fencing syntax:

\`\`\`html filename="index.html"
<!DOCTYPE html>
...your HTML here (link to styles.css and app.js — no inline styles or scripts)...
\`\`\`

\`\`\`css filename="styles.css"
...your CSS here...
\`\`\`

\`\`\`javascript filename="app.js"
...your JavaScript here...
\`\`\`

Rules:
1. The \`filename=\` attribute is MANDATORY on every code block.
2. HTML must reference \`styles.css\` via <link> and \`app.js\` via <script src>.
3. No inline <style> or <script> tags in index.html.
4. If the project needs multiple JS files, name them explicitly:
   filename="router.js", filename="api.js", etc.
5. Always output ALL files in a single response — do not split across messages.
6. If generating a backend, also include: filename="server.js", filename="package.json".

Example of correct output:

\`\`\`html filename="index.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My App</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app"></div>
  <script src="app.js"></script>
</body>
</html>
\`\`\`

\`\`\`css filename="styles.css"
/* styles here */
\`\`\`

\`\`\`javascript filename="app.js"
// logic here
\`\`\`

Keep responses focused and direct. Output signal, not noise.`;

// ── State ─────────────────────────────────────────────────────
const state: ChatState = {
    messages: [],
    isLoading: false,
    conversationHistory: []
};

// ── Utilities ─────────────────────────────────────────────────
function uid(): string { return Math.random().toString(36).slice(2, 10); }

function ts(d: Date): string {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function $(id: string): HTMLElement | null { return document.getElementById(id); }

function scrollChat(): void {
    const el = $('chat-scroll');
    if (el) el.scrollTop = el.scrollHeight;
}

function escHtml(s: string): string {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Markdown renderer ─────────────────────────────────────────
function renderMd(raw: string): string {
    if ((window as any).marked) {
        // Setup marked to use our custom code block renderer for syntax highlighting and copy buttons
        const renderer = new (window as any).marked.Renderer();
        renderer.code = function(arg1: any, arg2: any) {
            let code = typeof arg1 === 'object' ? arg1.text : arg1;
            let rawLang = typeof arg1 === 'object' ? arg1.lang : arg2;
            code = String(code || '');
            rawLang = String(rawLang || '').trim();
            
            let lang = 'text';
            let filename = '';
            
            // Check for filename="..." pattern
            const fnMatch = rawLang.match(/filename=["']?([^"']+)["']?/i);
            if (fnMatch) {
                filename = fnMatch[1];
                // extract clean language
                lang = rawLang.replace(/filename=["']?[^"'\s]+["']?/i, '').trim().split(/\s+/)[0] || 'text';
            } else {
                // Fallback to space-separated legacy format e.g. "html index.html"
                const langParts = rawLang.split(/\s+/);
                lang = langParts[0] || 'text';
                filename = langParts.slice(1).join(' ');
            }
            
            const id = 'cb-' + uid();
            let highlighted = escHtml(code);
            try {
                if ((window as any).hljs) {
                    const res = lang && lang !== 'text'
                        ? (window as any).hljs.highlight(code, { language: lang, ignoreIllegals: true })
                        : (window as any).hljs.highlightAuto(code);
                    highlighted = res.value;
                }
            } catch (_) {}
            
            return `
<div class="code-block" id="${id}" data-filename="${escHtml(filename)}" data-lang="${escHtml(lang)}">
  <div class="code-header" style="display:flex; justify-content:space-between; align-items:center;">
    <div style="display:flex; gap: 8px; align-items:center;">
      <span class="code-lang">${escHtml(lang)}</span>
      ${filename ? `<span style="font-family: monospace; color: #8a8a8a; font-size: 0.85em;">${escHtml(filename)}</span>` : ''}
    </div>
    <button class="copy-btn" onclick="copyCode('${id}')">Copy</button>
  </div>
  <pre><code class="hljs language-${escHtml(lang)}">${highlighted}</code></pre>
</div>`;
        };
        (window as any).marked.use({ renderer });
        return (window as any).marked.parse(raw);
    }

    // Fallback if marked fails to load for some reason
    return escHtml(raw).replace(/\n/g, '<br/>');
}
// ── Render Shell ──────────────────────────────────────────────
let activeOutputManager: OutputManager | null = null;

function renderWorkspacePlaceholder(): void {
    const pane = $('output-panel');
    if (!pane) return;

    pane.innerHTML = `
    <div class="workspace-placeholder">
      <div class="workspace-placeholder-inner">
        <div class="workspace-placeholder-logo">XV</div>
        <h3 class="workspace-placeholder-title">Xevora Compiler Sandbox</h3>
        <p class="workspace-placeholder-desc">Waiting for instructions. Describe what you want to build in the chat to start compiling modular files and launching live previews.</p>
      </div>
    </div>
    `;
    activeOutputManager = null;
}

function toggleWorkspaceMobile(): void {
    const pane = $('output-panel');
    if (!pane) return;
    pane.classList.toggle('active');
    
    const btn = $('mobile-toggle-workspace');
    if (btn) {
        const isActive = pane.classList.contains('active');
        btn.textContent = isActive ? "Show Chat" : "Workspace";
        btn.style.background = isActive ? "var(--gold)" : "var(--void-3)";
        btn.style.color = isActive ? "#000" : "var(--text-1)";
    }
}
(window as any).toggleWorkspaceMobile = toggleWorkspaceMobile;

// ── Render Shell ──────────────────────────────────────────────
function renderApp(): void {
    const app = $('app');
    if (!app) return;

    app.innerHTML = `
  <div class="workspace-container-layout">
    <!-- Left sidebar -->
    <aside class="sidebar">
      <a href="/" class="logo-mark" title="Back to Homepage" style="text-decoration:none;">XV</a>

      <button class="nav-btn active" onclick="newChat()" title="New Chat">
        <span class="material-symbols-outlined" style="font-size:18px">add</span>
      </button>
      <button class="nav-btn" title="History">
        <span class="material-symbols-outlined" style="font-size:18px">forum</span>
      </button>
      <button class="nav-btn" title="Search">
        <span class="material-symbols-outlined" style="font-size:18px">search</span>
      </button>

      <div style="flex:1"></div>

      <div style="width:28px;height:28px;border-radius:var(--r-md);background:var(--void-4);border:1px solid var(--border-2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;letter-spacing:0.06em;color:var(--text-3);cursor:default" title="Sarwar">SA</div>
    </aside>

    <!-- Chat pane -->
    <div class="chat-pane">
      <!-- Top bar -->
      <header class="topbar">
        <div style="display:flex;align-items:center;gap:12px">
          <a href="/" class="topbar-title" style="text-decoration:none;" title="Back to Homepage">Xevora AI</a>
          <div style="width:1px;height:16px;background:var(--border-2)"></div>
          <span class="topbar-model" id="model-label">${getActiveProvider().name}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <button id="mobile-toggle-workspace" onclick="toggleWorkspaceMobile()" style="display:none;background:var(--void-3);border:1px solid var(--border-1);color:var(--text-1);padding:4px 8px;border-radius:var(--r-sm);font-size:11px;font-family:inherit;cursor:pointer;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;margin-right:8px;">Workspace</button>
          <span class="chip chip-online" id="status-chip">Online</span>
        </div>
      </header>

      <!-- Chat messages -->
      <div class="chat-scroll" id="chat-scroll">
        <div class="chat-inner" id="chat-messages"></div>
      </div>

      <!-- Prompt bar -->
      <div class="prompt-bar-wrap">
        <div class="prompt-bar-inner">
          <div class="prompt-box" id="prompt-box">
            <span class="prompt-prefix">›</span>
            <textarea
              id="prompt-input"
              class="prompt-textarea"
              placeholder="describe what you want to build..."
              rows="1"
              oninput="autoResize(this)"
              onkeydown="handleKey(event)"
              spellcheck="false"
            ></textarea>
            <button class="send-btn" id="send-btn" onclick="sendMessage()" title="Send  ⏎">
              <span class="material-symbols-outlined" style="font-size:16px;font-variation-settings:'FILL' 1">arrow_upward</span>
            </button>
          </div>
          <p class="prompt-hint">⏎ send &nbsp;·&nbsp; ⇧⏎ newline &nbsp;·&nbsp; xevora may hallucinate — review all code</p>
        </div>
      </div>
    </div>

    <!-- Workspace Pane (Right-side Panel) -->
    <div class="workspace-pane" id="output-panel"></div>
  </div>

  <textarea id="copy-helper" style="position:fixed;opacity:0;pointer-events:none;left:-9999px;top:-9999px"></textarea>
  `;

    renderWorkspacePlaceholder();
    renderHome();
}

// ── Home screen ───────────────────────────────────────────────
function renderHome(): void {
    const msgs = $('chat-messages');
    if (!msgs) return;

    msgs.innerHTML = `
  <div class="home-screen">
    <div>
      <p class="home-prompt-prefix">// xevora ai &nbsp;·&nbsp; session start</p>
      <h1 class="home-headline">What are we<br>building<span>_</span><span class="term-cursor"></span></h1>
      <p class="home-sub">Qwen Coder 32B is ready. Describe anything — UI, API, algorithm, architecture.</p>
    </div>

    <div class="divider"></div>

    <div>
      <p style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-3);margin-bottom:12px">// Quick commands</p>
      <div class="cmd-grid">
        <div class="cmd-card" onclick="fillPrompt('Build a glassmorphic SaaS analytics dashboard with metric cards, area charts, and a dark sidebar nav using Tailwind CSS')">
          <div class="cmd-card-label">→ saas dashboard</div>
          <div class="cmd-card-desc">Metrics, charts, sidebar nav</div>
        </div>
        <div class="cmd-card" onclick="fillPrompt('Create a complete e-commerce product page with image gallery, cart drawer, reviews, and checkout — dark mode, Tailwind CSS')">
          <div class="cmd-card-label">→ e-commerce</div>
          <div class="cmd-card-desc">Product page + cart + checkout</div>
        </div>
        <div class="cmd-card" onclick="fillPrompt('Design a minimal developer portfolio with hero, project showcase, skills grid, and contact form — dark terminal aesthetic')">
          <div class="cmd-card-label">→ portfolio</div>
          <div class="cmd-card-desc">Projects, skills, contact</div>
        </div>
        <div class="cmd-card" onclick="fillPrompt('Build a real-time crypto portfolio tracker with price cards, sparkline graphs, P&L indicators — dark mode, Tailwind CSS')">
          <div class="cmd-card-label">→ crypto tracker</div>
          <div class="cmd-card-desc">Price cards, P&amp;L, sparklines</div>
        </div>
        <div class="cmd-card" onclick="fillPrompt('Create an AI SaaS landing page with animated hero, features section, pricing table, and testimonials — dark mode, modern design')">
          <div class="cmd-card-label">→ landing page</div>
          <div class="cmd-card-desc">Hero, features, pricing</div>
        </div>
        <div class="cmd-card" onclick="fillPrompt('Build a Kanban project management app with drag-and-drop columns, task cards, labels, and filters using vanilla JS')">
          <div class="cmd-card-label">→ kanban board</div>
          <div class="cmd-card-desc">Drag-drop, tasks, filters</div>
        </div>
      </div>
    </div>
  </div>
  `;
}

// ── Append message rows ───────────────────────────────────────
function addUserRow(text: string): void {
    const c = $('chat-messages');
    if (!c) return;

    // Clear home on first message
    if (state.messages.length === 0) c.innerHTML = '';

    const row = document.createElement('div');
    row.className = 'msg-row msg-row-user';
    row.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;justify-content:flex-end">
      <span class="msg-meta">${ts(new Date())}</span>
      <span style="font-family:var(--font-display);font-size:12px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;color:var(--text-3)">You</span>
    </div>
    <div class="msg-user-bubble">${escHtml(text)}</div>
  `;
    c.appendChild(row);
    scrollChat();
}

function addThinkingRow(): HTMLElement {
    const c = $('chat-messages');
    if (!c) return document.createElement('div');

    const row = document.createElement('div');
    row.id = 'typing-row';
    row.className = 'msg-row msg-row-ai';
    row.innerHTML = `
    <div class="msg-ai-header">
      <span class="ai-label">Xevora</span>
      <span class="msg-meta" id="typing-status">processing...</span>
    </div>
    <div class="tool-panel">
      <div class="tool-panel-header">
        <span>Tool Call</span>
        <div style="display:flex;gap:4px">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
      <div class="tool-panel-body" id="tool-panel-body">Routing to ${getActiveProvider().name}...</div>
    </div>
  `;
    c.appendChild(row);
    scrollChat();
    return row;
}

function loadWorkspaceWithMarkdown(content: string): void {
    const pane = $('output-panel');
    if (!pane) return;
    
    activeOutputManager = new OutputManager(pane, {
        zipName: "xevora-project.zip",
        autoPreview: true
    });
    activeOutputManager.handleAIOutput(content);
}

function loadMessageIntoWorkspace(btn: HTMLElement): void {
    const row = btn.closest('.msg-row');
    if (!row) return;
    const content = row.getAttribute('data-raw-content');
    if (content) {
        loadWorkspaceWithMarkdown(content);
        
        // Mobile panel slider
        const pane = $('output-panel');
        if (pane && !pane.classList.contains('active')) {
            toggleWorkspaceMobile();
        }
    }
}

(window as any).loadMessageIntoWorkspace = loadMessageIntoWorkspace;

function addErrorRow(content: string): void {
    const typing = $('typing-row');
    if (typing) typing.remove();

    const c = $('chat-messages');
    if (!c) return;

    const row = document.createElement('div');
    row.className = 'msg-row msg-row-ai';
    row.innerHTML = `
    <div class="msg-ai-header">
      <span class="ai-label" style="color:#ef4444">Error</span>
      <span class="msg-meta">${ts(new Date())}</span>
    </div>
    <div class="msg-error">${renderMd(content)}</div>
  `;
    c.appendChild(row);
    scrollChat();
}

// ── Send + fetch with retry ───────────────────────────────────
async function sendMessage(): Promise<void> {
    const input = $('prompt-input') as HTMLTextAreaElement;
    if (!input) return;

    const text = input.value.trim();
    if (!text || state.isLoading) return;

    state.isLoading = true;
    input.value = '';
    input.style.height = 'auto';
    setSend(false);

    addUserRow(text);
    state.conversationHistory.push({ role: 'user', content: text });
    state.messages.push({ id: uid(), role: 'user', content: text, timestamp: new Date() });

    const typingRow = addThinkingRow();

    try {
        let isFirstChunk = true;
        let aiRowBody: HTMLElement | null = null;
        let aiRow: HTMLElement | null = null;

        const reply = await fetchWithRetry(typingRow, (currentText) => {
            if (isFirstChunk) {
                isFirstChunk = false;
                if (typingRow && typingRow.parentNode) typingRow.remove();
                
                const c = $('chat-messages');
                if (c) {
                    aiRow = document.createElement('div');
                    aiRow.className = 'msg-row msg-row-ai';
                    aiRow.innerHTML = `
                    <div class="msg-ai-header" style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                      <div style="display:flex;align-items:center;gap:12px">
                        <span class="ai-label">Xevora</span>
                        <span class="msg-meta">${ts(new Date())} &nbsp;·&nbsp; ${getActiveProvider().name}</span>
                      </div>
                      <div class="msg-ai-header-actions"></div>
                    </div>
                    <div class="msg-ai-body"></div>
                    `;
                    c.appendChild(aiRow);
                    aiRowBody = aiRow.querySelector('.msg-ai-body');
                }
            }
            if (aiRowBody) {
                aiRowBody.innerHTML = renderMd(currentText);
                scrollChat();
            }
        });

        if (aiRow) {
            const hasCodeBlocks = reply.includes('```');
            if (hasCodeBlocks) {
                const headerActions = aiRow.querySelector('.msg-ai-header-actions');
                if (headerActions) {
                    headerActions.innerHTML = `
                      <button class="preview-btn" onclick="loadMessageIntoWorkspace(this)">
                        Load Workspace
                      </button>
                    `;
                }
            }

            if ((window as any).hljs) {
                aiRow.querySelectorAll('pre code').forEach(el => {
                    (window as any).hljs.highlightElement(el as HTMLElement);
                });
            }

            if (hasCodeBlocks) {
                loadWorkspaceWithMarkdown(reply);
                
                const isMobile = window.innerWidth <= 960;
                if (isMobile) {
                    const pane = $('output-panel');
                    if (pane && !pane.classList.contains('active')) {
                        toggleWorkspaceMobile();
                    }
                }
            }
            aiRow.setAttribute('data-raw-content', reply);
        }

        state.conversationHistory.push({ role: 'assistant', content: reply });
        state.messages.push({ id: uid(), role: 'assistant', content: reply, timestamp: new Date() });
    } catch (err: any) {
        const s = err?.status ?? 0;
        let msg = '';
        if (s === 429) {
            msg = `**Rate limited** — free tier exhausted.\n\nWait a moment and try again, or add credits at [openrouter.ai/settings](https://openrouter.ai/settings/integrations).`;
        } else if (s === 401) {
            msg = `**Invalid API key** — update \`VITE_OPENROUTER_API_KEY\` in \`.env.local\` and restart.`;
        } else if (s === 404) {
            msg = `**Model unavailable** — \`${getActiveProvider().name}\` returned 404. Raw error:\n\n\`\`\`json\n${err?.message}\n\`\`\``;
        } else {
            msg = `**Request failed** — ${escHtml(err?.message ?? 'Unknown error')}`;
        }
        addErrorRow(msg);
        console.error('[Xevora]', err);
    } finally {
        state.isLoading = false;
        setSend(true);
        input.focus();
    }
}

async function fetchWithRetry(typingRow: HTMLElement, onChunk: (text: string) => void): Promise<string> {
    const startIndex = currentProviderIndex;
    let attempts = 0;
    let lastError: any = null;

    while (attempts < AI_PROVIDERS.length) {
        const provider = getActiveProvider();
        try {
            const res = await fetch(provider.url || 'https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${provider.key}`,
                    'HTTP-Referer': 'https://xevora.ai',
                    'X-Title': 'Xevora AI'
                },
                body: JSON.stringify({
                    model: provider.model,
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        ...state.conversationHistory.slice(-10)
                    ],
                    max_tokens: 4096,
                    temperature: 0.7,
                    stream: true
                })
            });

            if (res.status === 429 || res.status === 529 || res.status === 502) {
                attempts++;
                if (attempts < AI_PROVIDERS.length) {
                    currentProviderIndex = (currentProviderIndex + 1) % AI_PROVIDERS.length;
                    switchProviderUI(typingRow, getActiveProvider().name);
                    continue;
                } else {
                    const e: any = new Error(`All fallback models are currently rate-limited.`);
                    e.status = 429;
                    throw e;
                }
            }

            if (!res.ok) {
                const text = await res.text();
                const e: any = new Error(`HTTP ${res.status} from ${provider.name}: ${text}`);
                e.status = res.status;
                throw e;
            }

            const reader = res.body?.getReader();
            if (!reader) throw new Error("No response body.");

            const decoder = new TextDecoder("utf-8");
            let done = false;
            let fullText = "";
            let buffer = "";

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                if (value) {
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || "";
                    
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed.startsWith('data: ')) {
                            const dataStr = trimmed.slice(6);
                            if (dataStr === '[DONE]') continue;
                            try {
                                const data = JSON.parse(dataStr);
                                const delta = data.choices?.[0]?.delta?.content || "";
                                fullText += delta;
                                onChunk(fullText);
                            } catch (e) {
                                // Ignore incomplete or invalid JSON
                            }
                        }
                    }
                }
            }
            return fullText;

        } catch (err: any) {
            if (err.status === 429) throw err;
            lastError = err;
            attempts++;
            if (attempts < AI_PROVIDERS.length) {
                currentProviderIndex = (currentProviderIndex + 1) % AI_PROVIDERS.length;
                switchProviderUI(typingRow, getActiveProvider().name);
            } else {
                break;
            }
        }
    }
    
    throw lastError;
}

function switchProviderUI(el: HTMLElement, newModelName: string): void {
    const statusEl = el.querySelector('#typing-status') as HTMLElement;
    const bodyEl   = el.querySelector('#tool-panel-body') as HTMLElement;
    if (statusEl) { 
        statusEl.textContent = 'failover triggered...'; 
        statusEl.style.color = 'var(--ember-bright)'; 
    }
    if (bodyEl) { 
        bodyEl.innerHTML = `<span style="color:var(--ember-bright)">Timeout</span> &nbsp;→&nbsp; Rerouting to <strong>${newModelName}</strong>...`; 
    }
}

// Removed countdown

function resetToolPanel(el: HTMLElement): void {
    const statusEl = el.querySelector('#typing-status') as HTMLElement;
    const bodyEl   = el.querySelector('#tool-panel-body') as HTMLElement;
    if (statusEl) { statusEl.textContent = 'processing...'; statusEl.style.color = ''; }
    if (bodyEl)   { bodyEl.textContent = `Routing to ${getActiveProvider().name}...`; }
}

// ── UI helpers ────────────────────────────────────────────────
function setSend(enabled: boolean): void {
    const btn = $('send-btn') as HTMLButtonElement;
    if (btn) btn.disabled = !enabled;
}

function handleKey(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}

function autoResize(el: HTMLTextAreaElement): void {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}

function fillPrompt(text: string): void {
    const inp = $('prompt-input') as HTMLTextAreaElement;
    if (!inp) return;
    inp.value = text;
    inp.focus();
    autoResize(inp);
}

function newChat(): void {
    state.messages = [];
    state.conversationHistory = [];
    state.isLoading = false;
    const inp = $('prompt-input') as HTMLTextAreaElement;
    if (inp) { inp.value = ''; inp.style.height = 'auto'; }
    renderApp();
    setSend(true);
}

function copyCode(blockId: string): void {
    const block = document.getElementById(blockId);
    if (!block) return;
    const code = block.querySelector('code');
    const btn  = block.querySelector('.copy-btn') as HTMLButtonElement;
    if (!code || !btn) return;

    const helper = $('copy-helper') as HTMLTextAreaElement;
    if (helper) { helper.value = code.innerText; helper.select(); document.execCommand('copy'); }

    btn.textContent = 'Copied';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
}

// ── Bind globals ──────────────────────────────────────────────
(window as any).sendMessage = sendMessage;
(window as any).handleKey   = handleKey;
(window as any).autoResize  = autoResize;
(window as any).fillPrompt  = fillPrompt;
(window as any).newChat     = newChat;
(window as any).copyCode    = copyCode;

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    renderApp();
    setTimeout(() => { const i = $('prompt-input'); if (i) i.focus(); }, 80);
});

console.log('[Xevora] Fallback matrix ready · primary:', getActiveProvider().name);
