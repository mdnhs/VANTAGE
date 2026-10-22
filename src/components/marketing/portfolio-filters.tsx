'use client';

export const ALL_FILTER = 'All';
// Also offered as suggestions in the admin project form, so categories stay consistent.
export const DEFAULT_FILTERS = [ALL_FILTER, 'Crash Repair', 'Bodywork', 'Paint', 'Respray', 'Restoration', 'Custom'];

interface PortfolioFiltersProps {
  filters?: string[];
  active?: string;
  onChange?: (filter: string) => void;
}

// Pill chips in the landing design language — active chip is the brand red.
export function PortfolioFilters({ filters = DEFAULT_FILTERS, active = ALL_FILTER, onChange }: PortfolioFiltersProps) {
  return (
    <div
      role='toolbar'
      aria-label='Filter projects by category'
      className='-mx-4 flex [scrollbar-width:none] items-center gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden'
    >
      {filters.map((filter) => {
        const isActive = filter === active;
        return (
          <button
            key={filter}
            type='button'
            aria-pressed={isActive}
            onClick={() => onChange?.(filter)}
            className={`shrink-0 rounded-full border px-4 py-2.5 font-[family-name:var(--font-inter)] text-[11px] leading-normal font-semibold tracking-[0.88px] whitespace-nowrap uppercase transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#16161a] focus-visible:outline-none ${
              isActive
                ? 'border-[#dc2626] bg-[#dc2626] text-white shadow-[0_8px_14px_rgba(220,38,38,0.25)]'
                : 'border-[#2a2a30] bg-[#1b1b20] text-[#b5b5b5] hover:border-[#dc2626]/60 hover:text-white'
            }`}
          >
            {filter}
          </button>
        );
      })}
    </div>
  );
}
