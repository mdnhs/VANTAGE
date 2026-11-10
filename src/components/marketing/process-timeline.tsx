import { StitchProcess } from '@/components/marketing/stitch-process';
import { InsuranceStepsDesktop } from '@/components/marketing/desktop-step-timelines';

interface TimelineStep {
  label: string;
  description: string;
}

interface ProcessTimelineProps {
  eyebrow: string;
  title: string;
  steps: TimelineStep[];
}

// Insurance claim steps. Phones and tablets use the homepage phase-card carousel (with the same
// pinned scrollytelling walk-through, see PageAnimations); desktop (lg+) shows the Figma
// seven-column numbered rail instead.
export function ProcessTimeline({ eyebrow, title, steps }: ProcessTimelineProps) {
  return (
    <>
      <div className='lg:hidden'>
        <StitchProcess
          eyebrow={eyebrow}
          title={title}
          steps={steps.map((step, index) => ({
            id: `${index}-${step.label}`,
            title: step.label,
            description: step.description,
            isHighlighted: false,
          }))}
        />
      </div>
      <InsuranceStepsDesktop
        eyebrow={eyebrow}
        title={title}
        steps={steps.map((step) => ({ title: step.label, description: step.description }))}
      />
    </>
  );
}
