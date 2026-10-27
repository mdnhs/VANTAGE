export type OwnerContact = { name: string; email: string };

export type Shortcut = { keys: string[][]; action: string };

// ⌘ on a Mac, Ctrl elsewhere: both are listed (the page renders on the server).
export const SHORTCUTS: readonly Shortcut[] = [
  {
    keys: [
      ['⌘', 'K'],
      ['Ctrl', 'K'],
    ],
    action: 'Search and go',
  },
  { keys: [['Esc']], action: 'Close panels' },
];

export type HelpGroupId = 'content' | 'inbox' | 'team';

export const HELP_GROUPS: readonly { id: HelpGroupId; title: string }[] = [
  { id: 'content', title: 'Website content' },
  { id: 'inbox', title: 'Enquiries and marketing' },
  { id: 'team', title: 'Team and account' },
];

export type HelpTopic = {
  id: string;
  group: HelpGroupId;
  title: string;
  // Short answer, then the steps.
  summary: string;
  steps: string[];
};

// Plain-language answers for the people who run the Auto Paint Shop website.
// Each one names a screen in the left menu.
export const HELP_TOPICS: readonly HelpTopic[] = [
  {
    id: 'edit-a-page',
    group: 'content',
    title: 'Change the words or pictures on a page',
    summary: 'Website lists every page of the site. Open one, change what you need, then save.',
    steps: [
      'Open Website in the left menu and choose the page, for example Home page or About.',
      'Edit a section’s text, button or image.',
      'Save your changes. The live site updates within a few seconds.',
      'Open the site in another tab and refresh to check how it looks to visitors.',
    ],
  },
  {
    id: 'services',
    group: 'content',
    title: 'Add or edit a service',
    summary: 'Each service has its own page, plus a card on the Services page and the home page.',
    steps: [
      'Open Website, then Services, and choose New service, or open one to edit it.',
      'Fill in the name, the card text, the banner text and picture, and what is included.',
      'Save. Drag services to change the order they show on the site.',
    ],
  },
  {
    id: 'our-work',
    group: 'content',
    title: 'Show your work and projects',
    summary: 'Our work holds finished jobs, with a gallery of before and after pictures.',
    steps: [
      'Open Website, then Our work, and choose New project.',
      'Add a title, a short description and the pictures from the media library.',
      'Save. The project appears on the Our work page.',
    ],
  },
  {
    id: 'media',
    group: 'content',
    title: 'Upload and reuse pictures',
    summary: 'Pictures are chosen from the media library wherever a page asks for an image.',
    steps: [
      'Open Media, then drop files in the upload box or choose them from your computer.',
      'Add a short description (alt text) so the picture works for people using screen readers. Pictures that still need one are marked Needs alt text.',
      'Use large, sharp photos for banners. Uploaded pictures are cleaned of hidden camera and location data.',
      'On any picture field, press Choose image to pick one you already uploaded.',
    ],
  },
  {
    id: 'settings',
    group: 'content',
    title: 'Change phone, email, address and menus',
    summary: 'Site settings holds the details that repeat across the whole site.',
    steps: [
      'Open Site settings and choose Contact details to change the phone number, email, address or opening hours.',
      'Use the other tabs for the header and footer menus and the shared sections.',
      'Save. The change shows across the site.',
    ],
  },
  {
    id: 'appearance',
    group: 'content',
    title: 'Change the site colours',
    summary: 'Appearance sets the colours of the public site.',
    steps: [
      'Open Appearance in the left menu and pick the colours you want.',
      'Check the preview. If a colour pair is hard to read, you are asked to fix it before saving.',
      'Save to put the new look on the live site.',
    ],
  },
  {
    id: 'enquiries',
    group: 'inbox',
    title: 'Handle quote requests and messages',
    summary: 'Every quote request and contact message sent through the site arrives under Enquiries.',
    steps: [
      'Open Enquiries. The number beside the menu item counts the ones nobody has looked at yet.',
      'Choose Quote requests or Contact messages, then open one to read it.',
      'Reply by email or phone, and update its status as you go.',
    ],
  },
  {
    id: 'seo',
    group: 'inbox',
    title: 'Help people find the site on Google',
    summary: 'SEO sets the page titles and descriptions shown in search results.',
    steps: [
      'Open SEO to see which pages are missing a title or description.',
      'Open Defaults to set the wording used when a page has none of its own.',
      'Use Redirects when you change a page address, so old links keep working.',
    ],
  },
  {
    id: 'marketing',
    group: 'inbox',
    title: 'Tracking, cookie banner and custom code',
    summary: 'Marketing holds analytics, the cookie consent banner and extra scripts.',
    steps: [
      'Open Marketing, then Tracking, and enter your tracking IDs. Nothing loads until a visitor accepts cookies.',
      'Use Consent banner to change the wording visitors see.',
      'Only an owner can add custom code. Only paste code from vendors you trust.',
    ],
  },
  {
    id: 'people',
    group: 'team',
    title: 'Invite a colleague and choose what they can do',
    summary: 'Owners and administrators manage the team under Users & roles.',
    steps: [
      'Open Users & roles and choose Invite user, then enter their name and email.',
      'Pick a role. The permission list shows what each role can change.',
      'Remove access any time from the same screen.',
    ],
  },
  {
    id: 'signin',
    group: 'team',
    title: 'Sign in, passwords and two-factor',
    summary: 'Staying signed in, choosing a password and what to do when you are locked out.',
    steps: [
      'Change your password, or turn on two-factor sign-in, under Account.',
      'Too many wrong attempts pauses sign-in for a short while. Wait, then try again.',
      'Locked out or lost your two-factor device? Ask an owner (see Who to contact). They can reset your access.',
    ],
  },
  {
    id: 'activity',
    group: 'team',
    title: 'See who changed something',
    summary: 'Activity log records sign-ins and edits by everyone on the team.',
    steps: [
      'Open Activity log and filter by person, action or date.',
      'Select a row to see its details, including what changed.',
    ],
  },
];
