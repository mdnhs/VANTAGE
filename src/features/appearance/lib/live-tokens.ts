// The draft applied to the admin itself, inline on <html>. Inline style beats
// the published <style>, and the cleanup hands back to it. Only custom
// property names are accepted, so a declaration list can never set anything else.
export function applyLive(root: HTMLElement, decls: [string, string][]): () => void {
  const touched: [string, string][] = [];
  for (const [name, value] of decls) {
    if (!/^--[a-z][a-z0-9-]*$/.test(name)) continue;
    touched.push([name, root.style.getPropertyValue(name)]);
    root.style.setProperty(name, value);
  }
  return () => {
    // Reverse order, so a name set twice ends on its first previous value.
    for (const [name, previous] of touched.reverse()) {
      if (previous) root.style.setProperty(name, previous);
      else root.style.removeProperty(name);
    }
  };
}
