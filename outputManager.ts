import { parseAIOutput, type ParsedFile } from "./parser";
import { assemblePreview } from "./assembler";
import { exportAsZip } from "./exporter";

export interface OutputManagerOptions {
  zipName?: string;
  autoPreview?: boolean;   // default: true — switch to preview tab on completion
  onFilesReady?: (files: ParsedFile[]) => void;
}

export class OutputManager {
  private container: HTMLElement;
  private options: OutputManagerOptions;
  private files: ParsedFile[] = [];

  // DOM refs — set by render()
  private tabCode!: HTMLElement;
  private tabPreview!: HTMLElement;
  private tabFiles!: HTMLElement;
  private panelCode!: HTMLElement;
  private panelPreview!: HTMLElement;
  private panelFiles!: HTMLElement;
  private previewFrame!: HTMLIFrameElement;
  private exportBtn!: HTMLButtonElement;

  constructor(container: HTMLElement, options: OutputManagerOptions = {}) {
    this.container = container;
    this.options = { autoPreview: true, ...options };
    this.render();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Call this once the AI stream finishes. Pass the full raw markdown. */
  handleAIOutput(rawMarkdown: string): void {
    const result = parseAIOutput(rawMarkdown);
    this.files = result.files;

    this.renderCodePanel(result.files);
    this.renderFilesPanel(result.files);
    this.loadPreview(result.files);

    if (this.options.autoPreview !== false) {
      // Small delay so the user sees the code flash before switching
      setTimeout(() => this.switchTab("preview"), 400);
    }

    this.exportBtn.disabled = false;
    this.options.onFilesReady?.(result.files);
  }

  /** Stream-friendly: call this on each chunk, then call finalise() when done. */
  streamChunk(chunk: string): void {
    const codeEl = this.panelCode.querySelector<HTMLElement>(".xv-stream-target");
    if (codeEl) codeEl.textContent += chunk;
  }

  finalise(rawMarkdown: string): void {
    this.handleAIOutput(rawMarkdown);
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  private render(): void {
    this.container.innerHTML = "";
    this.container.style.cssText =
      "display:flex;flex-direction:column;height:100%;font-family:inherit;";

    // ── Tab bar ──
    const tabBar = document.createElement("div");
    tabBar.style.cssText =
      "display:flex;align-items:center;gap:0;border-bottom:1px solid #1e1e2e;background:#0d0d14;padding:0 12px;";

    this.tabCode    = this.makeTab("Code",    "code");
    this.tabPreview = this.makeTab("Preview", "preview");
    this.tabFiles   = this.makeTab("Files",   "files");

    this.exportBtn = document.createElement("button");
    this.exportBtn.textContent = "⬇ Export ZIP";
    this.exportBtn.disabled = true;
    this.exportBtn.style.cssText =
      "margin-left:auto;padding:5px 14px;font-size:12px;font-family:inherit;" +
      "background:#00d4ff;color:#0d0d14;border:none;border-radius:6px;" +
      "cursor:pointer;font-weight:600;opacity:0.4;transition:opacity .2s;";
    this.exportBtn.addEventListener("click", () => this.doExport());
    this.exportBtn.addEventListener("mouseover", () => {
      if (!this.exportBtn.disabled) this.exportBtn.style.opacity = "1";
    });
    this.exportBtn.addEventListener("mouseout", () => {
      if (!this.exportBtn.disabled) this.exportBtn.style.opacity = "0.85";
    });

    // Re-enable style when not disabled
    const origHandleOutput = this.handleAIOutput.bind(this);
    this.handleAIOutput = (md: string) => {
      origHandleOutput(md);
      this.exportBtn.style.opacity = "0.85";
    };

    tabBar.append(this.tabCode, this.tabPreview, this.tabFiles, this.exportBtn);

    // ── Panels ──
    const panels = document.createElement("div");
    panels.style.cssText = "flex:1;position:relative;overflow:hidden;";

    this.panelCode    = this.makePanel();
    this.panelPreview = this.makePanel();
    this.panelFiles   = this.makePanel();

    // Code panel placeholder
    this.panelCode.innerHTML =
      `<pre class="xv-stream-target" style="margin:0;padding:20px;font-size:13px;` +
      `font-family:'JetBrains Mono',monospace;color:#cdd6f4;white-space:pre-wrap;` +
      `word-break:break-word;height:100%;box-sizing:border-box;overflow:auto;` +
      `background:#0d0d14;"></pre>`;

    // Preview panel
    this.previewFrame = document.createElement("iframe");
    this.previewFrame.style.cssText =
      "width:100%;height:100%;border:none;background:#fff;";
    this.previewFrame.sandbox.add(
      "allow-scripts",
      "allow-same-origin",
      "allow-forms",
      "allow-modals"
    );
    this.panelPreview.appendChild(this.previewFrame);

    // Files panel placeholder
    this.panelFiles.innerHTML =
      `<p style="padding:24px;color:#6c7086;font-size:13px;font-family:inherit;">` +
      `No files yet. Generate something first.</p>`;

    panels.append(this.panelCode, this.panelPreview, this.panelFiles);
    this.container.append(tabBar, panels);

    this.switchTab("code");
  }

  private makeTab(label: string, id: string): HTMLElement {
    const tab = document.createElement("button");
    tab.textContent = label;
    tab.dataset.tab = id;
    tab.style.cssText =
      "padding:10px 18px;font-size:13px;font-family:inherit;border:none;" +
      "background:transparent;color:#6c7086;cursor:pointer;border-bottom:2px solid transparent;" +
      "transition:color .15s,border-color .15s;";
    tab.addEventListener("click", () => this.switchTab(id));
    return tab;
  }

  private makePanel(): HTMLElement {
    const p = document.createElement("div");
    p.style.cssText =
      "position:absolute;inset:0;display:none;overflow:auto;";
    return p;
  }

  private switchTab(id: string): void {
    const tabs   = [this.tabCode,    this.tabPreview,    this.tabFiles];
    const panels = [this.panelCode,  this.panelPreview,  this.panelFiles];
    const ids    = ["code",          "preview",          "files"];

    ids.forEach((tid, i) => {
      const active = tid === id;
      tabs[i].style.color       = active ? "#00d4ff" : "#6c7086";
      tabs[i].style.borderColor = active ? "#00d4ff" : "transparent";
      panels[i].style.display   = active ? "block"   : "none";
    });
  }

  private renderCodePanel(files: ParsedFile[]): void {
    const pre = this.panelCode.querySelector<HTMLElement>(".xv-stream-target");
    if (!pre) return;

    pre.textContent = files
      .map(
        (f) =>
          `// ── ${f.filename} ${"─".repeat(Math.max(0, 48 - f.filename.length))}\n${f.content}`
      )
      .join("\n\n");
  }

  private renderFilesPanel(files: ParsedFile[]): void {
    this.panelFiles.innerHTML = "";

    const list = document.createElement("div");
    list.style.cssText = "padding:16px;display:flex;flex-direction:column;gap:8px;";

    for (const file of files) {
      const card = document.createElement("div");
      card.style.cssText =
        "display:flex;align-items:center;justify-content:space-between;" +
        "padding:10px 14px;border-radius:8px;border:1px solid #1e1e2e;" +
        "background:#0d0d14;cursor:pointer;transition:border-color .15s;";

      card.innerHTML =
        `<span style="font-family:'JetBrains Mono',monospace;font-size:13px;color:#cdd6f4;">` +
        `${fileIcon(file.filename)} ${file.filename}</span>` +
        `<span style="font-size:11px;color:#6c7086;">${file.content.split("\n").length} lines</span>`;

      card.addEventListener("click", () => {
        const pre = this.panelCode.querySelector<HTMLElement>(".xv-stream-target");
        if (pre) pre.textContent = file.content;
        this.switchTab("code");
      });

      card.addEventListener("mouseover", () => {
        card.style.borderColor = "#313244";
      });
      card.addEventListener("mouseout", () => {
        card.style.borderColor = "#1e1e2e";
      });

      list.appendChild(card);
    }

    this.panelFiles.appendChild(list);
  }

  private loadPreview(files: ParsedFile[]): void {
    const { srcdoc } = assemblePreview(files);
    this.previewFrame.srcdoc = srcdoc;
  }

  private async doExport(): Promise<void> {
    if (!this.files.length) return;
    this.exportBtn.textContent = "Zipping…";
    this.exportBtn.disabled = true;
    try {
      await exportAsZip(this.files, {
        zipName: this.options.zipName ?? "xevora-project.zip",
      });
    } finally {
      this.exportBtn.textContent = "⬇ Export ZIP";
      this.exportBtn.disabled = false;
      this.exportBtn.style.opacity = "0.85";
    }
  }
}

// ── File icon helper ──────────────────────────────────────────────────────────

function fileIcon(filename: string): string {
  if (filename.endsWith(".html")) return "🌐";
  if (filename.endsWith(".css"))  return "🎨";
  if (filename.endsWith(".js") || filename.endsWith(".ts")) return "⚡";
  if (filename.endsWith(".json")) return "{}";
  if (filename.endsWith(".md"))   return "📄";
  return "📁";
}
