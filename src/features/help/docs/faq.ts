import type { HelpArticle } from '../types';

export const FAQ_DOCS: readonly HelpArticle[] = [
  {
    slug: 'troubleshooting',
    group: 'faq',
    title: 'Something looks wrong',
    description: 'Quick answers when a change does not show or a screen is missing.',
    lead: 'Quick answers to the problems people run into most.',
    keywords: ['problem', 'not working', 'missing', 'error', 'faq'],
    sections: [
      {
        title: 'My change does not show on the site',
        blocks: [
          {
            type: 'list',
            items: [
              'Page text: did you press **Publish changes**? Drafts are only visible in the preview.',
              'Records: did you press **Save changes** and see no error?',
              'Refresh the live page. Still old? Try a private window, which skips your browser’s saved copy.',
            ],
          },
        ],
      },
      {
        title: 'A screen is missing from my menu',
        blocks: [
          {
            type: 'p',
            text: 'Your role decides which screens you can open. See [What each role can do](/dashboard/help/roles) and ask an owner if you need more.',
          },
        ],
      },
      {
        title: 'A form is greyed out',
        blocks: [
          {
            type: 'p',
            text: 'You can read that screen but not change it. If you are using **View as**, everything is read-only until you press **Stop viewing**.',
          },
        ],
      },
      {
        title: 'Someone else saved first',
        blocks: [
          {
            type: 'p',
            text: 'Two people edited the same form. Their version is loaded: make your change again and save.',
          },
        ],
      },
      {
        title: 'The chat assistant gives old details',
        blocks: [
          {
            type: 'p',
            text: 'Its memory is out of date. Press **Sync website data** under [Live chat AI](/dashboard/help/live-chat-ai).',
          },
        ],
      },
      {
        title: 'Enquiry emails are not arriving',
        blocks: [
          {
            type: 'p',
            text: 'Check the addresses and press **Send test email** under [Email notifications](/dashboard/help/email-notifications). The bell also shows "An enquiry email didn’t send".',
          },
        ],
      },
      {
        title: 'I can’t delete a picture',
        blocks: [
          {
            type: 'p',
            text: 'It is still used on a page. The **Used on** list shows where; remove it there first. See [Alt text, captions and focal point](/dashboard/help/media-details).',
          },
        ],
      },
    ],
  },
];
