import { HELP_GROUPS, HELP_TOPICS, SHORTCUTS, type OwnerContact } from '../content';
import { HelpDocs } from './help-docs';

// The Help page: laid out like a docs site, with how-to answers for the people
// who run the website, keyboard shortcuts, and the owners to ask for access.
export function HelpView({ owners }: { owners: OwnerContact[] }) {
  return <HelpDocs topics={HELP_TOPICS} groups={HELP_GROUPS} shortcuts={SHORTCUTS} owners={owners} />;
}
