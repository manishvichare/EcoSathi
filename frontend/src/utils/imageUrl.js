/**
 * Resolves a complaint photo URL so it renders properly in the frontend.
 * Handles local uploads, Windows paths, backend URLs, and relative paths.
 */
export function resolveImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  // Blob and Data URLs (e.g. freshly selected file before upload)
  if (rawUrl.startsWith('blob:') || rawUrl.startsWith('data:')) {
    return rawUrl;
  }

  // Already a complete web URL
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl;
  }

  // Extract clean filename from Windows or Unix file paths
  const filename = rawUrl.replace(/\\/g, '/').split('/').pop();
  if (!filename) return null;

  // Derive backend base origin. In production uploads share this app's origin.
  const apiBase =
    import.meta.env?.VITE_API_URL ||
    import.meta.env?.VITE_API_BASE_URL ||
    (import.meta.env?.DEV ? 'http://localhost:5000/api' : '/api');
  const backendOrigin = apiBase.replace(/\/api\/?$/, '');

  return `${backendOrigin}/uploads/complaints/${filename}`;
}
