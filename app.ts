// ============================================================
// Xevora AI — Claude Code Design System (TypeScript)
// Terminal-dark. Monospace-first. Pure utility.
// ============================================================

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

When building applications:
- Always separate logic into multiple files (e.g. index.html, styles.css, app.js).
- Format code blocks using a custom language identifier that includes the filename:
  \`\`\`html index.html
  <!-- HTML code -->
  \`\`\`
  \`\`\`css styles.css
  /* CSS code */
  \`\`\`
  \`\`\`javascript app.js
  // JS code
  \`\`\`
- Link your CSS and JS correctly in the HTML.
- Make designs beautiful: dark modes, smooth animations, premium feel.
- Write complete, working code — never pseudocode or placeholders.

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
            rawLang = String(rawLang || '');
            
            const langParts = rawLang.split(' ');
            const lang = langParts[0] || 'text';
            const filename = langParts.length > 1 ? langParts.slice(1).join(' ') : '';
            
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
function renderApp(): void {
    const app = $('app');
    if (!app) return;

    app.innerHTML = `
  <!-- Left sidebar -->
  <aside class="sidebar">
    <div class="logo-mark" onclick="newChat()" title="New Chat">XV</div>

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

    <div style="width:28px;height:28px;border-radius:0.125rem;background:#272727;border:1px solid #2e2e2e;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;letter-spacing:0.06em;color:#8a8a8a;cursor:default" title="Sarwar">SA</div>
  </aside>

  <!-- Main pane -->
  <div class="main-pane">

    <!-- Top bar -->
    <header class="topbar">
      <div style="display:flex;align-items:center;gap:12px">
        <span class="topbar-title">Xevora AI</span>
        <div style="width:1px;height:16px;background:#2e2e2e"></div>
        <span class="topbar-model" id="model-label">${getActiveProvider().name}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
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

  <textarea id="copy-helper" style="position:fixed;opacity:0;pointer-events:none;left:-9999px;top:-9999px"></textarea>
  `;

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
      <p style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#4b5563;margin-bottom:10px">// Quick commands</p>
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
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;justify-content:flex-end">
      <span class="msg-meta">${ts(new Date())}</span>
      <span style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#8a8a8a">You</span>
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

function addAIRow(content: string): void {
    const typing = $('typing-row');
    if (typing) typing.remove();

    const c = $('chat-messages');
    if (!c) return;

    const row = document.createElement('div');
    row.className = 'msg-row msg-row-ai';
    row.innerHTML = `
    <div class="msg-ai-header" style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <span class="ai-label">Xevora</span>
        <span class="msg-meta">${ts(new Date())} &nbsp;·&nbsp; ${getActiveProvider().name}</span>
      </div>
      <button class="preview-btn" onclick="openPreview(this)" style="font-size:12px; background:var(--primary); color:var(--on-primary); padding: 4px 12px; border-radius: 4px; border:none; cursor:pointer; font-weight: bold;">
        Live Preview
      </button>
    </div>
    <div class="msg-ai-body">${renderMd(content)}</div>
  `;
    c.appendChild(row);

    // Syntax highlight any newly added code blocks
    if ((window as any).hljs) {
        row.querySelectorAll('pre code').forEach(el => {
            (window as any).hljs.highlightElement(el as HTMLElement);
        });
    }

    scrollChat();
}

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
        const reply = await fetchWithRetry(typingRow);
        addAIRow(reply);
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

async function fetchWithRetry(typingRow: HTMLElement): Promise<string> {
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
                    temperature: 0.7
                })
            });

            if (res.status === 429 || res.status === 529 || res.status === 502) {
                // Rate limited or overloaded. Switch to next provider.
                attempts++;
                if (attempts < AI_PROVIDERS.length) {
                    currentProviderIndex = (currentProviderIndex + 1) % AI_PROVIDERS.length;
                    switchProviderUI(typingRow, getActiveProvider().name);
                    continue; // Try next model immediately
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
                throw e; // Hard fail on auth/bad request errors
            }

            const data = await res.json();
            const content = data.choices?.[0]?.message?.content;
            if (!content || content.trim() === '') {
                const e: any = new Error(`Empty response from ${provider.name}. Forcing failover.`);
                e.status = 502; // Treat empty response as a bad gateway to force fallback
                throw e;
            }
            return content;

        } catch (err: any) {
            // Network errors or throw above
            if (err.status === 429) throw err; // Already handled exhaust
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
        statusEl.style.color = '#d97706'; 
    }
    if (bodyEl) { 
        bodyEl.innerHTML = `<span style="color:#ef4444">Timeout</span> &nbsp;→&nbsp; Rerouting to <strong>${newModelName}</strong>...`; 
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
    renderHome();
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

(window as any).openPreview = function(btn: HTMLElement) {
    const row = btn.closest('.msg-row');
    if (!row) return;
    
    // Extract code blocks
    const blocks = row.querySelectorAll('.code-block');
    let html = '';
    let css = '';
    let js = '';
    
    blocks.forEach(block => {
        const lang = block.getAttribute('data-lang');
        const filename = block.getAttribute('data-filename') || '';
        const rawCode = block.querySelector('code')?.textContent || '';
        
        if (lang === 'html' || filename.endsWith('.html')) html = rawCode;
        else if (lang === 'css' || filename.endsWith('.css')) css = rawCode;
        else if (lang === 'javascript' || lang === 'js' || filename.endsWith('.js')) js = rawCode;
    });
    
    if (!html) {
        // If there's no HTML but there is JS/CSS, maybe wrap it in a boilerplate?
        // Otherwise alert the user.
        html = '<!DOCTYPE html><html><head></head><body><h1>Live Preview</h1><p>No HTML file generated by AI to preview.</p></body></html>';
    }
    
    // Assemble
    const assembled = html
        .replace('</head>', `<style>${css}</style></head>`)
        .replace('</body>', `<script>${js}</script></body>`);
        
    // Spawn preview modal
    let modal = document.getElementById('preview-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'preview-modal';
        modal.innerHTML = `
            <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.9); z-index:9999; display:flex; flex-direction:column; padding: 32px; box-sizing: border-box;">
                <div style="display:flex; justify-content:space-between; align-items:center; background: #0a0a0a; padding: 12px 24px; border-radius: 12px 12px 0 0; border: 1px solid #2e2e2e; border-bottom: none;">
                    <h3 style="color:#e8e8e8; margin:0; font-family: monospace; font-size: 14px;">Live Preview Panel</h3>
                    <button onclick="document.getElementById('preview-modal').style.display='none'" style="background:none; border:none; color:#8a8a8a; cursor:pointer; font-size:20px; transition: color 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#8a8a8a'">✖</button>
                </div>
                <iframe id="preview-frame" style="flex:1; width:100%; background:#fff; border: 1px solid #2e2e2e; border-radius: 0 0 12px 12px;"></iframe>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    modal.style.display = 'flex';
    const iframe = document.getElementById('preview-frame') as HTMLIFrameElement;
    if (iframe) {
        iframe.srcdoc = assembled;
    }
};
