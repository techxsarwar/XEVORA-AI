import type { ParsedFile } from "./parser";

export interface AssembledPreview {
  srcdoc: string;
  title: string;
}

export function assemblePreview(files: ParsedFile[]): AssembledPreview {
  const htmlFile = files.find((f) => f.filename.endsWith(".html"));
  const cssFiles = files.filter((f) => f.filename.endsWith(".css"));
  const jsFiles = files.filter(
    (f) => f.filename.endsWith(".js") || f.filename.endsWith(".ts")
  );

  // If there's no HTML file, wrap JS/CSS in a minimal shell
  if (!htmlFile) {
    const shell = buildShell(cssFiles, jsFiles);
    return { srcdoc: shell, title: "preview" };
  }

  let html = htmlFile.content;

  // Inline external CSS references that we have in memory
  for (const cssFile of cssFiles) {
    // Replace <link rel="stylesheet" href="styles.css"> with <style>...</style>
    const linkRegex = new RegExp(
      `<link[^>]+href=["']${escapeRegex(cssFile.filename)}["'][^>]*>`,
      "gi"
    );
    if (linkRegex.test(html)) {
      html = html.replace(
        new RegExp(
          `<link[^>]+href=["']${escapeRegex(cssFile.filename)}["'][^>]*>`,
          "gi"
        ),
        `<style>\n${cssFile.content}\n</style>`
      );
    } else {
      // No explicit link — inject before </head> or at top
      html = injectBeforeHead(html, `<style>\n${cssFile.content}\n</style>`);
    }
  }

  // Inline external JS references that we have in memory
  for (const jsFile of jsFiles) {
    const scriptRegex = new RegExp(
      `<script[^>]+src=["']${escapeRegex(jsFile.filename)}["'][^>]*><\\/script>`,
      "gi"
    );
    if (scriptRegex.test(html)) {
      html = html.replace(
        new RegExp(
          `<script[^>]+src=["']${escapeRegex(jsFile.filename)}["'][^>]*><\\/script>`,
          "gi"
        ),
        `<script>\n${jsFile.content}\n</script>`
      );
    } else {
      // No explicit script tag — inject before </body>
      html = injectBeforeBody(html, `<script>\n${jsFile.content}\n</script>`);
    }
  }

  // Extract <title> for display
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : htmlFile.filename;

  return { srcdoc: html, title };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildShell(cssFiles: ParsedFile[], jsFiles: ParsedFile[]): string {
  const styles = cssFiles.map((f) => `<style>\n${f.content}\n</style>`).join("\n");
  const scripts = jsFiles.map((f) => `<script>\n${f.content}\n</script>`).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Preview</title>
${styles}
</head>
<body>
${scripts}
</body>
</html>`;
}

function injectBeforeHead(html: string, code: string): string {
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${code}\n</head>`);
  if (/<head>/i.test(html)) return html.replace(/<head>/i, `<head>\n${code}`);
  return `${code}\n${html}`;
}

function injectBeforeBody(html: string, code: string): string {
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${code}\n</body>`);
  return `${html}\n${code}`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
