/**
 * Converts any image path to use the production Railway domain
 * @param {string} [pathOrUrl] - Relative or absolute image path
 * @returns {string} - Absolute URL with production domain
 */
export function toProdUrl(pathOrUrl) {
  if (!pathOrUrl) return '';
  
  const PROD_ORIGIN = 'https://testfrontenddev-production.up.railway.app';
  
  // Already absolute URL - replace old domains
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
      .replace('https://test-frontend-dev.up.railway.app', PROD_ORIGIN)
      .replace('http://localhost:4000', PROD_ORIGIN);
  }
  
  // Normalize legacy public/uploads/qr paths
  let normalized = pathOrUrl.replace(/^\/?public\/uploads\/qr/, 'uploads/qr');
  
  // Ensure single leading slash
  const path = normalized.startsWith('/') ? normalized : `/${normalized}`;
  
  return `${PROD_ORIGIN}${path}`;
}
