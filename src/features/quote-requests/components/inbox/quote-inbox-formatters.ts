export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 45) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  const isCurrentYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'short',
    year: isCurrentYear ? undefined : 'numeric',
  });
}

export function formatFullDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  );
}

const AVATAR_COLORS = [
  'bg-red-500/15 text-red-500 border-red-500/20',
  'bg-blue-500/15 text-blue-500 border-blue-500/20',
  'bg-amber-500/15 text-amber-500 border-amber-500/20',
  'bg-emerald-500/15 text-emerald-500 border-emerald-500/20',
  'bg-violet-500/15 text-violet-500 border-violet-500/20',
  'bg-indigo-500/15 text-indigo-500 border-indigo-500/20',
  'bg-cyan-500/15 text-cyan-500 border-cyan-500/20',
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  pdr: 'Paintless Dent Repair (PDR)',
  'crash-repair': 'Crash & Collision Repair',
  paintwork: 'Precision Respraying',
  'scratch-repair': 'Scratch & Scuff Repair',
  structural: 'Structural Chassis Alignment',
  classic: 'Classic Car Restoration',
  alloy: 'Alloy Wheel Refurbishment',
};

export function formatServiceType(serviceType?: string | null): string {
  if (!serviceType) return 'General Bodywork Assessment';
  const key = serviceType.toLowerCase().trim();
  if (SERVICE_TYPE_LABELS[key]) return SERVICE_TYPE_LABELS[key];
  return serviceType.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
