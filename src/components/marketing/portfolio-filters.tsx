const FILTERS = ['All', 'Crash Repair', 'Bodywork', 'Paint', 'Respray', 'Restoration', 'Custom'];

export function PortfolioFilters() {
  return (
    <div className='flex w-full items-start gap-4 overflow-x-auto pb-4'>
      {FILTERS.map((filter, index) => {
        const isActive = index === 0;
        return (
          <button
            key={filter}
            type='button'
            className={
              isActive
                ? 'shrink-0 rounded-full border border-[#ffb4ab]/30 bg-[#2a2a2a] px-6 py-2.5 text-xs font-semibold tracking-[1.2px] text-[#e5e2e1] uppercase drop-shadow-[0_0_7.5px_rgba(255,180,171,0.1)] transition-transform hover:scale-105'
                : 'shrink-0 rounded-full border border-white/10 px-6 py-2.5 text-xs font-semibold tracking-[1.2px] text-[#e6bdb8] uppercase transition-all hover:scale-105 hover:border-white/20 hover:text-[#e5e2e1]'
            }
          >
            {filter}
          </button>
        );
      })}
    </div>
  );
}
