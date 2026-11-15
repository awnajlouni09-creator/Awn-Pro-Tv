/**
 * Runtime environment guard for static hosts (Netlify, Vercel, GitHub Pages, etc.).
 * Ensures missing process.env or import.meta.env keys never crash the UI.
 */
(() => {
  try {
    const g = globalThis as unknown as { process?: { env?: Record<string, string | undefined> } };
    if (typeof g.process === 'undefined') {
      g.process = { env: {} };
    } else if (!g.process.env) {
      g.process.env = {};
    }
  } catch {
    // Ignore in strictly frozen environments
  }
})();

export function getOptionalEnv(key: string): string {
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env;
    if (metaEnv && typeof metaEnv[key] === 'string') {
      return metaEnv[key] as string;
    }
    const g = globalThis as unknown as { process?: { env?: Record<string, string | undefined> } };
    if (g.process?.env && typeof g.process.env[key] === 'string') {
      return g.process.env[key] as string;
    }
  } catch {
    // Safe fallback
  }
  return '';
}

export const SAFE_VITE_GEMINI_API_KEY = getOptionalEnv('VITE_GEMINI_API_KEY');
