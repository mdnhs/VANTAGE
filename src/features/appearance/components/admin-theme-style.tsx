import { adminThemeCss } from '@/lib/theme/css';
import type { ThemeConfigValue } from '@/lib/theme/schema';

// The published admin theme, rendered server-side so there is no flash. The default theme
// emits nothing, so the admin stays byte-identical. The Appearance page previews drafts
// client-side.
export function AdminThemeStyle({ theme }: { theme: ThemeConfigValue }) {
  const css = adminThemeCss(theme.admin);
  return css ? <style id='theme-tokens'>{css}</style> : null;
}
