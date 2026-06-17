/**
 * Sanitizes a filename for safe download:
 * - Strips brackets, parentheses, and special characters
 * - Replaces spaces with underscores
 * - Forces .jpg extension
 */
export function sanitizeFilename(original: string): string {
  const base = original
    .replace(/\.[^/.]+$/, "")           // strip existing extension
    .replace(/[()[\]{}<>]/g, "")        // remove brackets
    .replace(/[^a-zA-Z0-9_\- ]/g, "")  // remove special chars
    .replace(/\s+/g, "_")              // spaces → underscores
    .replace(/_+/g, "_")              // collapse multiple underscores
    .replace(/^_|_$/g, "")            // trim leading/trailing underscores
    .toLowerCase();

  return (base || "download") + ".jpg";
}
