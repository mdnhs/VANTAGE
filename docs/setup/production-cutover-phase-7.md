# Phase 7 cutover: marketing (tracking, consent, custom code)

## Custom-code kill switch

Marketing pages are statically prerendered, so the public tracking frame (consent banner, trackers, custom
snippets) is built at prerender time from tagged cached settings. Saving Tracking, Consent banner or Custom
code expires those tags and the pages refresh at once.

`DISABLE_CUSTOM_SCRIPTS=true` is read at prerender time as well:

- Changing it needs a rebuild or redeploy to take effect.
- The instant kill switch is in the admin: clear or switch off the snippets in Custom code (owner only). That
  save takes effect immediately and History keeps the previous version for rollback.

## Tracking off by default

With the defaults (banner off, no tracker enabled, no snippets) the prerendered HTML contains no
`vantage-tracking` script, no consent banner and no "Cookie settings" link.
