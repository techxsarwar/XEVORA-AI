export interface ParsedFile {
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

// Matches:
//   ```html filename="index.html"
//   ```css filename="styles.css"
//   ```js filename="app.js"
//   ```javascript filename="app.js"
//   ```html:index.html
//   ```css:styles.css
// Also matches plain ```html / ```css / ```js blocks and auto-names them.
const FENCE_REGEX =
  /```(\w+)(?:\s+filename=["']([^"']+)["']|:([^\s`]+))?\s*\n([\s\S]*?)```/gi;

const LANG_TO_DEFAULT_FILENAME: Record<string, string> = {
  html: "index.html",
  css: "styles.css",
  js: "app.js",
  javascript: "app.js",
  ts: "app.ts",
  typescript: "app.ts",
  json: "data.json",
  md: "README.md",
  markdown: "README.md",
};

export function parseAIOutput(rawMarkdown: string): ParseResult {
  const files: ParsedFile[] = [];
  const seen = new Map<string, number>(); // filename → count (for dedup)

  let match: RegExpExecArray | null;
  FENCE_REGEX.lastIndex = 0;

  while ((match = FENCE_REGEX.exec(rawMarkdown)) !== null) {
    const lang = match[1].toLowerCase();
    const explicitName = match[2] || match[3]; // from filename= or :name
    const content = match[4].trimEnd();

    if (!content.trim()) continue; // skip empty blocks

    // Determine filename
    let filename =
      explicitName ||
      LANG_TO_DEFAULT_FILENAME[lang] ||
      `output.${lang}`;

    // Deduplicate: if we've seen this filename before, suffix it
    if (seen.has(filename)) {
      const count = seen.get(filename)! + 1;
      seen.set(filename, count);
      const dot = filename.lastIndexOf(".");
      filename =
        dot > -1
          ? `${filename.slice(0, dot)}_${count}${filename.slice(dot)}`
          : `${filename}_${count}`;
    } else {
      seen.set(filename, 1);
    }

    files.push({ filename, language: lang, content });
  }

  // Fallback: if AI dumped a single HTML blob with embedded <style>/<script>,
  // and no explicit multi-file output, split it automatically.
  if (
    files.length === 1 &&
    files[0].filename === "index.html" &&
    shouldSplit(files[0].content)
  ) {
    return splitMonolith(files[0].content);
  }

  return {
    files,
    hasHTML: files.some((f) => f.filename.endsWith(".html")),
    hasCSS: files.some((f) => f.filename.endsWith(".css")),
    hasJS: files.some(
      (f) => f.filename.endsWith(".js") || f.filename.endsWith(".ts")
    ),
  };
}

// ── Monolith splitter ────────────────────────────────────────────────────────
// Detects an HTML file that has <style> and/or <script> blocks and splits them.

function shouldSplit(html: string): boolean {
  return /<style[\s>]/i.test(html) || /<script[\s>]/i.test(html);
}

function splitMonolith(html: string): ParseResult {
  const files: ParsedFile[] = [];

  // Extract <style> blocks
  const cssBlocks: string[] = [];
  const cleanedHTML1 = html.replace(
    /<style[^>]*>([\s\S]*?)<\/style>/gi,
    (_, css) => {
      cssBlocks.push(css.trim());
      return `  <link rel="stylesheet" href="styles.css">`;
    }
  );

  // Extract <script> blocks (not src="...")
  const jsBlocks: string[] = [];
  const cleanedHTML2 = cleanedHTML1.replace(
    /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi,
    (_, js) => {
      jsBlocks.push(js.trim());
      return `  <script src="app.js"></script>`;
    }
  );

  files.push({ filename: "index.html", language: "html", content: cleanedHTML2.trim() });

  if (cssBlocks.length) {
    files.push({
      filename: "styles.css",
      language: "css",
      content: cssBlocks.join("\n\n"),
    });
  }

  if (jsBlocks.length) {
    files.push({
      filename: "app.js",
      language: "js",
      content: jsBlocks.join("\n\n"),
    });
  }

  return {
    files,
    hasHTML: true,
    hasCSS: cssBlocks.length > 0,
    hasJS: jsBlocks.length > 0,
  };
}
