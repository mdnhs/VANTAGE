'use client';

import { RevealContent } from '@/components/marketing/ui/reveal-content';
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
      className='-mx-5 flex [scrollbar-width:none] items-center gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:gap-2.5 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden'
    >
      {filters.map((filter) => {
        const isActive = filter === active;
        return (
          <button
            data-reveal-button
            key={filter}
            type='button'
            aria-pressed={isActive}
            onClick={() => onChange?.(filter)}
            className={`relative shrink-0 overflow-hidden rounded-full border px-4 py-2.5 font-site-body text-[14px] leading-normal font-semibold tracking-normal whitespace-nowrap normal-case transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#20252d] focus-visible:outline-none sm:text-[11px] sm:tracking-[0.88px] sm:uppercase xl:px-5 xl:py-[11px] xl:text-[13px] xl:tracking-normal xl:normal-case ${
              isActive
                ? 'border-brand bg-brand text-[#f1f3f6] shadow-[0_8px_14px_rgb(var(--brand-rgb)/0.25)] xl:border-[#f1f3f6] xl:bg-[#f1f3f6] xl:text-[#1b1f26] xl:shadow-none'
                : 'border-[#3e4551] bg-[#2e343e] text-[#d5d9e0] hover:border-brand/60 hover:text-[#f1f3f6] sm:border-[#353c47] sm:bg-[#262b34] sm:text-[#b9bfc9] xl:font-medium'
            }`}
          >
            <RevealContent band={isActive ? 'dark' : 'brand'}>{filter}</RevealContent>
          </button>
        );
      })}
    </div>
  );
}
