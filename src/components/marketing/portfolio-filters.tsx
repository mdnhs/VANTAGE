const FILTERS = ['All', 'Crash Repair', 'Bodywork', 'Paint', 'Respray', 'Restoration', 'Custom'];

export function PortfolioFilters() {
  return (
    <div className='-mx-4 flex w-full [scrollbar-width:none] items-start gap-2.5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:gap-4 sm:px-0 [&::-webkit-scrollbar]:hidden'>
      {FILTERS.map((filter, index) => {
        const isActive = index === 0;
        return (
          <button
            key={filter}
            type='button'
            className={
              isActive
                ? 'shrink-0 rounded-full border border-red-500/50 bg-[#2a2a2a] px-6 py-2.5 text-xs font-semibold tracking-[1.2px] text-white uppercase drop-shadow-[0_0_10px_rgba(220,38,38,0.25)] transition-transform hover:scale-105'
                : 'shrink-0 rounded-full border border-white/10 px-6 py-2.5 text-xs font-semibold tracking-[1.2px] text-neutral-400 uppercase transition-all hover:scale-105 hover:border-white/20 hover:text-white'
            }
          >
            {filter}
          </button>
        );
      })}
    </div>
  );
}
