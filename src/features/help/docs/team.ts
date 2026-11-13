import type { HelpArticle } from '../types';

export const TEAM_DOCS: readonly HelpArticle[] = [
  {
    slug: 'people',
    group: 'team',
    title: 'Invite and manage people',
    description: 'Invite colleagues, change their roles, ban or remove them.',
    lead: '**Users & roles** lists everyone who can sign in to the admin.',
    permission: { user: ['list'] },
    keywords: ['invite', 'users', 'team', 'ban', 'remove', 'delete', 'sign out'],
    sections: [
      {
        title: 'Invite someone',
        blocks: [
          {
            type: 'steps',
            items: [
              'Open **Users & roles** and press **Invite someone**.',
              'Enter their **Name** and **Email**, and pick a **Role**. The role’s purpose shows underneath.',
              'Press **Send invite**. They get an email with a link to choose their password.',
            ],
          },
          { type: 'open', href: '/dashboard/users', label: 'Open Users & roles' },
          {
            type: 'callout',
            tone: 'note',
            text: 'If email is not set up, you get a link to copy instead. Send it to them yourself: it works once and is not shown again.',
          },
        ],
      },
      {
        title: 'Find someone',
        blocks: [
          {
            type: 'p',
            text: 'Search by name or email, or filter by role or status (**Active**, **Banned**, **Invite pending**, **No two-factor**).',
          },
        ],
      },
      {
        title: 'Row actions',
        blocks: [{ type: 'p', text: 'Press **…** on a person’s row.' }],
      },
      {
        title: 'Change roles',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: 'Tick one or more roles and press **Save roles**. They get everything any chosen role allows. Only an owner can make someone an owner.',
          },
        ],
      },
      {
        title: 'Ban, sign out or delete',
        level: 3,
        blocks: [
          {
            type: 'list',
            items: [
              '**Ban**: signs them out and blocks sign-in for a set time or until you lift it.',
              '**Sign out everywhere**: ends their sessions; they can sign in again.',
              '**Delete**: removes their access for good. Their past activity stays in the log.',
              '**Resend invite**: for invites not yet accepted.',
            ],
          },
        ],
      },
      {
        title: 'View as this person',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: 'See the admin exactly as they do, to check what they can reach. It is read-only, lasts up to an hour and is recorded in the Activity log. Press **Stop viewing** in the banner to return.',
          },
        ],
      },
    ],
  },
  {
    slug: 'roles',
    group: 'team',
    title: 'What each role can do',
    description: 'The eight roles and what each one is for.',
    lead: 'A role decides which screens someone sees and what they can change. The **Roles** tab in Users & roles shows the full table.',
    keywords: ['roles', 'permissions', 'owner', 'admin', 'editor', 'author', 'marketer', 'intake', 'support', 'viewer'],
    sections: [
      {
        title: 'The roles',
        blocks: [
          {
            type: 'list',
            items: [
              '**Owner**: everything, including other owners and custom code.',
              '**Admin**: everything except custom code and managing owners.',
              '**Editor**: page text, site content, media and SEO, plus contact details, menus, footer and forms.',
              '**Author**: creates and edits content without deleting; projects only their own.',
              '**Marketer**: SEO, redirects and tracking. No quotes or messages.',
              '**Intake**: the quote requests and contact messages inbox only.',
              '**Support**: live chats assigned to them only.',
              '**Viewer**: read-only access.',
            ],
          },
        ],
      },
      {
        title: 'Read-only screens',
        blocks: [
          {
            type: 'p',
            text: 'Someone who can see a screen but not change it sees the form greyed out, with no save button.',
          },
        ],
      },
      {
        title: 'Choosing a role',
        blocks: [
          {
            type: 'callout',
            tone: 'tip',
            text: 'Give people the smallest role that covers their job. You can always add more later.',
          },
        ],
      },
    ],
  },
  {
    slug: 'activity',
    group: 'team',
    title: 'See who changed something',
    description: 'The activity log records sign-ins and edits by everyone.',
    lead: '**Activity log** records who changed what, and when. Times are Irish time.',
    permission: { audit: ['read'] },
    keywords: ['audit', 'history', 'log', 'changes', 'export'],
    sections: [
      {
        title: 'Find a change',
        blocks: [
          {
            type: 'steps',
            items: [
              'Open **Activity log**.',
              'Filter by **Action**, **Entity**, **Person** or dates (**From** and **To**).',
              'Press **Changes** on a row to see each field before and after.',
            ],
          },
          { type: 'open', href: '/dashboard/activity', label: 'Open Activity log' },
        ],
      },
      {
        title: 'What is recorded',
        blocks: [
          {
            type: 'p',
            text: 'Saves to content and settings, sign-ins, two-factor changes, "View as" sessions and the automatic clean-ups (shown as **System**). Press **Export CSV** to download the filtered list.',
          },
        ],
      },
    ],
  },
  {
    slug: 'account',
    group: 'team',
    title: 'Your account, password and two-factor',
    description: 'Change your name, password, two-factor sign-in and signed-in devices.',
    lead: '**Account**, opened from your picture at the top right, holds your own settings.',
    keywords: ['password', 'two-factor', '2fa', 'account', 'profile', 'devices', 'dark mode'],
    sections: [
      {
        title: 'Profile',
        blocks: [
          {
            type: 'p',
            text: 'Change your **Name**, and choose **Light** or **Dark** for the admin.',
          },
          { type: 'open', href: '/dashboard/account', label: 'Open Account' },
        ],
      },
      {
        title: 'Password',
        blocks: [
          {
            type: 'p',
            text: 'On **Security**, enter your current password and a new one of at least 8 characters, then press **Change password**. Your other devices are signed out.',
          },
        ],
      },
      {
        title: 'Two-factor sign-in',
        blocks: [
          {
            type: 'steps',
            items: [
              'On **Security**, press **Set up two-factor** and enter your password.',
              'Scan the QR code with an authenticator app on your phone.',
              'Enter the 6-digit code and press **Verify**.',
              'Save your backup codes somewhere safe. Each works once if you lose your phone.',
            ],
          },
          {
            type: 'callout',
            tone: 'tip',
            text: 'Two-factor is strongly recommended for anyone who can change who has access.',
          },
        ],
      },
      {
        title: 'Devices',
        blocks: [
          {
            type: 'p',
            text: '**Devices** lists where you are signed in. Sign out one you don’t recognise, or press **Sign out other devices**.',
          },
        ],
      },
    ],
  },
  {
    slug: 'sign-in',
    group: 'team',
    title: 'Signing in and getting back in',
    description: 'First sign-in, forgotten passwords and lockouts.',
    lead: 'How to sign in for the first time, and what to do if you can’t.',
    keywords: ['login', 'sign in', 'forgot password', 'reset', 'locked out', 'invite', 'backup code'],
    sections: [
      {
        title: 'Your first sign-in',
        blocks: [
          {
            type: 'p',
            text: 'Open the link in your invite email, choose a password and press **Set password**. Then sign in with your email and that password.',
          },
        ],
      },
      {
        title: 'Forgot your password',
        blocks: [
          {
            type: 'steps',
            items: [
              'On the sign-in page, press **Forgot password?**.',
              'Enter your email and press **Send reset link**.',
              'Open the link within 24 hours and choose a new password.',
            ],
          },
          {
            type: 'p',
            text: 'Sessions last seven days, after which you sign in again.',
          },
        ],
      },
      {
        title: 'Locked out',
        blocks: [{ type: 'p', text: 'Check which case applies.' }],
      },
      {
        title: 'Too many attempts',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: '"Too many attempts" means wait a minute and try again. Ten wrong two-factor codes lock two-factor sign-in for 15 minutes.',
          },
        ],
      },
      {
        title: 'Lost your phone',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: 'Press **Use a backup code** on the two-factor screen. No backup codes? Ask an owner to reset your access. See [Who to contact](/dashboard/help/who-to-contact).',
          },
        ],
      },
    ],
  },
  {
    slug: 'who-to-contact',
    group: 'team',
    title: 'Who to contact',
    description: 'Owners can invite people, change roles and reset access.',
    lead: 'Owners can invite people, change roles and reset access. Ask one of them when you are stuck.',
    keywords: ['owner', 'contact', 'access', 'help'],
    sections: [{ title: 'Owners', blocks: [{ type: 'owners' }] }],
  },
];
