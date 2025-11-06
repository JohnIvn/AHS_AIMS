// API URL utility for both development and production
export function getApiUrl(path) {
  // In development with Vite, use /api prefix (proxied to backend)
  // In production/Electron, use direct backend URL (strip /api prefix)
  const isDev = import.meta.env.DEV;
  const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:3000";

  if (isDev) {
    // Development: use Vite proxy with /api prefix
    return path;
  } else {
    // Production/Electron: strip /api prefix and use direct backend URL
    const cleanPath = path.startsWith("/api") ? path.substring(4) : path;
    return `${apiBase}${cleanPath}`;
  }
}

export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:3000";
