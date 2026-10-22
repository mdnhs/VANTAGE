import * as z from 'zod';

// Where the preview endpoints may send a browser: a site path, never another
// origin ("//x", "https://x") and no query string or dots.
export const PreviewPath = z
  .string()
  .max(200)
  .regex(/^\/(?!\/)[A-Za-z0-9/_-]*$/, 'Use an internal path, e.g. /about');
