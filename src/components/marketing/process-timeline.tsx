import { StitchProcess } from '@/components/marketing/stitch-process';

interface TimelineStep {
  label: string;
  description: string;
}

interface ProcessTimelineProps {
  eyebrow: string;
  title: string;
  steps: TimelineStep[];
}

// Insurance claim steps rendered with the homepage phase-card carousel, so they get the same
// pinned scrollytelling walk-through (see PageAnimations) as every other step sequence.
export function ProcessTimeline({ eyebrow, title, steps }: ProcessTimelineProps) {
  return (
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
  );
}
