'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useId } from 'react';

export const ALL_FILTER = 'All';
// Also offered as suggestions in the admin project form, so categories stay consistent.
export const DEFAULT_FILTERS = [ALL_FILTER, 'Crash Repair', 'Bodywork', 'Paint', 'Respray', 'Restoration', 'Custom'];

interface PortfolioFiltersProps {
  filters?: string[];
  active?: string;
  onChange?: (filter: string) => void;
}

// A well-damped spring: the pill glides and stops, with no bounce at the end.
const GLIDE = { type: 'spring', stiffness: 320, damping: 36, mass: 0.9 } as const;

// Pill chips in the landing design language. One highlight pill glides to the chosen chip
// (shared layout animation), so it follows the chip through scrolling, wrapping and resizing.
export function PortfolioFilters({ filters = DEFAULT_FILTERS, active = ALL_FILTER, onChange }: PortfolioFiltersProps) {
  const pillId = useId();
  const reduceMotion = useReducedMotion();

  return (
    <div
      role='toolbar'
      aria-label='Filter projects by category'
      className='relative isolate -mx-5 flex [scrollbar-width:none] items-center gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:gap-2.5 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden'
    >
      {filters.map((filter) => {
        const isActive = filter === active;
        return (
          <button
            key={filter}
            type='button'
            aria-pressed={isActive}
            onClick={() => onChange?.(filter)}
            className='group relative shrink-0 rounded-full px-4 py-2.5 font-site-body text-[14px] leading-normal font-semibold tracking-normal whitespace-nowrap normal-case focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#20252d] focus-visible:outline-none sm:text-[11px] sm:tracking-[0.88px] sm:uppercase xl:px-5 xl:py-[11px] xl:text-[13px] xl:tracking-normal xl:normal-case'
          >
            {/* The chip's own surface; the gliding pill covers it on the active chip. */}
            <span
              aria-hidden
              className={`absolute inset-0 z-0 rounded-full border transition-colors duration-300 ${
                isActive
                  ? 'border-transparent'
                  : 'border-[#3e4551] bg-[#2e343e] group-hover:border-brand/60 sm:border-[#353c47] sm:bg-[#262b34]'
              }`}
            />
            {isActive && (
              <motion.span
                aria-hidden
                layoutId={pillId}
                transition={reduceMotion ? { duration: 0 } : GLIDE}
                style={{ borderRadius: 9999 }}
                className='pointer-events-none absolute inset-0 z-[1] bg-brand shadow-[0_8px_14px_rgb(var(--brand-rgb)/0.25)] xl:bg-[#f1f3f6] xl:shadow-none'
              />
            )}
            <span
              className={`relative z-[2] block transition-colors duration-300 ${
                isActive
                  ? 'text-[#f1f3f6] xl:text-[#1b1f26]'
                  : 'text-[#d5d9e0] group-hover:text-[#f1f3f6] sm:text-[#b9bfc9] xl:font-medium'
              }`}
            >
              {filter}
            </span>
          </button>
        );
      })}
    </div>
  );
}
