// Browser snippet: paste into the DevTools console (or evaluate over CDP) on a public page.
// Evaluates to a JSON-serialisable map { "<DOM path>": { <property>: <computed value> } } for
// every element under <body>. Save it and compare two captures with
// scripts/theme/diff-computed-styles.ts.
(() => {
  const PROPS = [
    'color',
    'background-color',
    'background-image',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'outline-color',
    'box-shadow',
    'filter',
    'text-decoration-color',
    'fill',
    'stroke',
    'font-family',
  ];
  // Non-visual and framework-injected nodes are ignored, and indexes count only the remaining
  // siblings, so a different number of <script> tags between builds never shifts a path.
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'NEXT-ROUTE-ANNOUNCER']);
  const kept = (el) => Array.from(el.children).filter((child) => !SKIP.has(child.tagName));
  const out = {};
  const pathOf = (el) => {
    const parts = [];
    for (let node = el; node && node !== document.body; node = node.parentElement) {
      const index = node.parentElement ? kept(node.parentElement).indexOf(node) : 0;
      parts.unshift(`${node.tagName.toLowerCase()}[${index}]`);
    }
    return `body/${parts.join('/')}`;
  };
  for (const el of document.body.querySelectorAll('*')) {
    if (SKIP.has(el.tagName) || el.closest('next-route-announcer')) continue;
    const style = getComputedStyle(el);
    const record = {};
    for (const prop of PROPS) record[prop] = style.getPropertyValue(prop);
    out[pathOf(el)] = record;
  }
  return out;
})();
