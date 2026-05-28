# Xevora Engine — Integration Guide

> **Author:** Sarwar Altaf Dar  
> Drop these 4 files into your Xevora project and wire them up in minutes.

---

## Files

| File | Role |
|------|------|
| `parser.ts` | Extracts named code blocks from AI markdown → array of `ParsedFile` |
| `assembler.ts` | Stitches files into a single `srcdoc` for iframe preview |
| `exporter.ts` | Packages files into a `.zip` and triggers browser download |
| `outputManager.ts` | Orchestrates everything + renders the tabbed UI |
| `systemPrompt.py` | Copy the prompt string into your OpenRouter system prompt |

---

## 1. Install JSZip

```bash
npm i jszip
```

Or via CDN in your HTML:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
```

---

## 2. Wire up in your app

```typescript
import { OutputManager } from "./xevora-engine/outputManager";

// Point it at a container element in your UI
const container = document.getElementById("output-panel")!;
const manager = new OutputManager(container, {
  zipName: "xevora-project.zip",
  autoPreview: true, // auto-switch to preview when generation finishes
});

// After your AI stream completes, pass the full raw markdown:
const rawMarkdown = await callOpenRouter(userPrompt);
manager.handleAIOutput(rawMarkdown);
```

### Streaming mode (optional)
```typescript
// Feed chunks as they arrive
for await (const chunk of stream) {
  manager.streamChunk(chunk);
  buffer += chunk;
}
// Finalise when stream ends
manager.finalise(buffer);
```

---

## 3. Update your system prompt

Add the content of `systemPrompt.py` → `XEVORA_CODE_OUTPUT_RULES` to your
OpenRouter API call's `system` field. This forces the model to always output
named, modular code blocks.

```typescript
const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "meta-llama/llama-3-70b-instruct",
    messages: [
      { role: "system", content: XEVORA_CODE_OUTPUT_RULES },
      { role: "user",   content: userPrompt },
    ],
  }),
});
```

---

## 4. How the parser works

The parser detects fenced code blocks with a `filename=` attribute:

````
```html filename="index.html"
...
```
```css filename="styles.css"
...
```
````

If the AI outputs a single `index.html` blob with embedded `<style>` and `<script>`,
the parser automatically splits it — CSS goes to `styles.css`, JS goes to `app.js`,
and `index.html` is rewritten with `<link>` and `<script src>` references.

---

## 5. Flow diagram

```
AI response (raw markdown)
        │
        ▼
   parser.ts ──── extracts named files ────► ParsedFile[]
        │                                         │
        │                                    assembler.ts
        │                                         │
        │                                    srcdoc string
        │                                         │
        ▼                                         ▼
outputManager.ts ─── renders tabs ──► [Code] [Preview] [Files]
        │                                    ▲
        │                             iframe srcdoc
        │
        └── Export ZIP button ──► exporter.ts ──► .zip download
```

---

*Built for Xevora AI Vibe Studio by Sarwar Altaf Dar*
