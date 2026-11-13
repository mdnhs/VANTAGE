import type { HelpArticle } from '../types';

export const START_DOCS: readonly HelpArticle[] = [
  {
    slug: 'getting-started',
    group: 'start',
    title: 'Getting started',
    description: 'Find your way around the admin and learn how saving and publishing work.',
    lead: 'The admin is where you change the website, answer enquiries and chats, and look after the team. This guide shows where things are and how changes reach the live site.',
    keywords: ['intro', 'welcome', 'basics', 'menu', 'publish', 'draft'],
    sections: [
      {
        title: 'Finding your way',
        blocks: [
          {
            type: 'p',
            text: 'The left menu lists every area your role can open, so a colleague may see more or fewer items than you.',
          },
          {
            type: 'list',
            items: [
              '**Dashboard**: today’s enquiries, jobs and anything that needs attention.',
              '**Website**: every page of the site, plus services, projects and legal pages.',
              '**Media**: the library of images, videos and PDFs.',
              '**Enquiries** and **Live chat**: where visitors reach you.',
              '**SEO** and **Marketing**: search results, redirects, tracking and the cookie banner.',
              '**Appearance**, **Site settings**, **Users & roles** and **Activity log**: the whole site and the team.',
            ],
          },
          {
            type: 'callout',
            tone: 'tip',
            text: 'Press `⌘K` (or `Ctrl K` on Windows) anywhere to search and jump straight to a screen.',
          },
        ],
      },
      {
        title: 'How changes go live',
        blocks: [
          {
            type: 'p',
            text: 'The admin saves in three different ways. The screen always tells you which one it uses.',
          },
        ],
      },
      {
        title: 'Page text: draft, then publish',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: 'Page text (Home page, About, Process, Contact and the top of other pages) saves itself as a **draft** about a second after you stop typing. Only you see it, in the **Preview** beside the form.',
          },
          {
            type: 'steps',
            items: [
              'Make your changes. The status line shows **Saving draft…**, then **Draft saved — only you see it in the preview**.',
              'Check the preview on Desktop, Tablet and Phone.',
              'Press **Publish changes**. Visitors see the new text within a few seconds.',
            ],
          },
          {
            type: 'p',
            text: 'Changed your mind? Press **Discard changes** in the yellow banner to go back to what is live.',
          },
        ],
      },
      {
        title: 'Records: Save changes',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: 'Services, projects, reviews, legal pages and the other lists have their own form with a **Create …** or **Save changes** button. They do not autosave, so remember to press it.',
          },
        ],
      },
      {
        title: 'Settings: live on save',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: 'Site settings, SEO and Marketing go live as soon as you press their save button. There is no draft.',
          },
        ],
      },
      {
        title: 'Undo with History',
        blocks: [
          {
            type: 'p',
            text: 'Most forms have a **History** button. Every save is kept (the latest 20). Pick one and press **Restore** to bring it back.',
          },
          {
            type: 'callout',
            tone: 'note',
            text: 'If someone else saves the same form while you are working, you are told and their version is loaded. Make your change again on top of theirs.',
          },
        ],
      },
      {
        title: 'Getting more help',
        blocks: [
          {
            type: 'p',
            text: 'Something missing from your menu, or locked out? Ask an owner. See [Who to contact](/dashboard/help/who-to-contact).',
          },
        ],
      },
    ],
  },
  {
    slug: 'dashboard',
    group: 'start',
    title: 'Read the dashboard',
    description: 'What the cards on the first screen mean.',
    lead: 'The **Dashboard** is the first screen after signing in. It shows what needs attention today. The cards you see depend on your role.',
    keywords: ['home', 'overview', 'kpi', 'stats', 'pipeline'],
    sections: [
      {
        title: 'Enquiry figures',
        blocks: [
          {
            type: 'p',
            text: 'People who can read quote requests see the workshop figures at the top:',
          },
          {
            type: 'list',
            items: [
              '**Total New Enquiries**: leads nobody has contacted yet. "All caught up" means none are waiting.',
              '**Active Jobs**, **Completed Work** and **Pending Quotes**: where jobs are in the pipeline.',
              '**Sales & Revenue**: the value of the open pipeline.',
              '**Conversion Rate**: how many leads became jobs.',
              '**Monthly Intake Trends**, **Intake Channels** and **Enquiries this week**: where enquiries come from and how this week compares with last.',
            ],
          },
          { type: 'open', href: '/dashboard', label: 'Open Dashboard' },
        ],
      },
      {
        title: 'Site health',
        blocks: [
          {
            type: 'list',
            items: [
              '**SEO Health**: how many search checks pass. See [Fix SEO issues](/dashboard/help/seo-overview).',
              '**Content health**: pages that are complete, need work, or are missing SEO or alt text. **Content to review** lists them.',
              '**Next up**: a short checklist of setup jobs still to do.',
              '**Team activity**: the latest changes by the team (owners and admins).',
            ],
          },
        ],
      },
      {
        title: 'Quick buttons',
        blocks: [
          {
            type: 'p',
            text: '**New Enquiry** logs a phone call or walk-in, and **Pipeline Board** opens the quote pipeline. **View site** opens the public website.',
          },
        ],
      },
    ],
  },
  {
    slug: 'keyboard-shortcuts',
    group: 'start',
    title: 'Keyboard shortcuts',
    description: 'Quick keys for the jobs you do most.',
    lead: 'A few keys work on every screen of the admin.',
    keywords: ['keys', 'command', 'palette', 'search'],
    sections: [
      { title: 'Shortcuts', blocks: [{ type: 'shortcuts' }] },
      {
        title: 'Search',
        blocks: [
          {
            type: 'p',
            text: 'The search opened by `⌘K` finds screens by name and by what they do. Try typing "phone", "logo" or "redirect".',
          },
        ],
      },
    ],
  },
];
