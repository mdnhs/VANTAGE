import { API_ROUTES } from '@/lib/routes/api-routes';

const baseUrl = () => `${process.env.NEXT_PUBLIC_API_PREFIX || '/api'}${process.env.NEXT_PUBLIC_API_VERSION || '/v1'}`;

// Full-page navigations (the preview sets a cookie and redirects), so these
// are hrefs, never fetch targets.
export const previewHref = (path: string) => `${baseUrl()}${API_ROUTES.preview.enter(path)}`;
// A path PreviewPath rejects (query string, dots, '//') makes the API fall back to '/'.
export const exitPreviewHref = (path: string) => `${baseUrl()}${API_ROUTES.preview.exit(path)}`;
