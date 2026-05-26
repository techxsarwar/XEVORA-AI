<div align="center">
  <img src="https://raw.githubusercontent.com/techxsarwar/XEVORA-AI/main/stitch_xevora_ai_vibe_studio/xevora_ai_logo/screen.png" alt="Xevora AI Vibe Studio" width="400" />
  <h1>Xevora AI Vibe Studio</h1>
  <p><strong>A high-precision, multi-model AI coding engine with instant live execution.</strong></p>
</div>

---

## ⚡ Features

### 🧠 Multi-Model Matrix Routing
Xevora AI employs a robust fallback matrix routing system. If your primary AI model goes offline or exhausts its rate limits, Xevora automatically fails over to secondary high-capacity models (e.g., Llama 3 70B, Qwen Coder) to ensure zero downtime during your workflow.

### 📦 Modular Multi-File Generation
No more spaghetti code in a single HTML file. The internal engine forces the AI to decouple logic into independent, modular files (`index.html`, `styles.css`, `app.js`). Xevora automatically parses, extracts, and tags the generated files with an industrial-grade markdown parser.

### 🚀 Instant Live Preview Sandbox
Don't copy/paste code to test it. Click **Live Preview** on any generated AI response, and the built-in assembly engine will instantly stitch the raw code blocks together, spawning a sandboxed DOM execution environment right over your chat.

### 🎨 Claude Code Design System
A sleek, premium, terminal-dark substrate UI. Monospace-first, pure utility, built with performance and developer ergonomics in mind.

---

## 🛠️ Tech Stack

- **Frontend:** TypeScript, Vite, Vanilla CSS
- **Markdown Engine:** Marked.js + Highlight.js (Custom DOM Injection)
- **AI Integration:** OpenRouter API (Fallback Matrix)

## 🚀 Quick Start

1. **Clone the repo**
   \`\`\`bash
   git clone https://github.com/techxsarwar/XEVORA-AI.git
   cd XEVORA-AI
   \`\`\`

2. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configure Environment**
   Create a \`.env.local\` file in the root directory:
   \`\`\`env
   VITE_OPENROUTER_API_KEY=your_api_key_here
   \`\`\`

4. **Run the Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`

---

*Designed for builders.*
