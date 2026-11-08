export type Box = { left: number; right: number; top: number; bottom: number };

const overlaps = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

// How far the chat button has to rise so nothing underneath it is covered.
export function liftToClear(widget: Box, controls: Box[], gap: number): number {
  const covered = controls.filter((control) => overlaps(widget, control));
  if (covered.length === 0) return 0;
  return Math.max(...covered.map((control) => widget.bottom - control.top + gap));
}
