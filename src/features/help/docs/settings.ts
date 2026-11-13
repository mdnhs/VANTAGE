import type { HelpArticle } from '../types';

export const SETTINGS_DOCS: readonly HelpArticle[] = [
  {
    slug: 'business-identity',
    group: 'settings',
    title: 'Business name, logo and social profiles',
    description: 'The business name, logo, favicon, animated logo and social links.',
    lead: '**Site settings**, **Identity** holds who the business is: its name, logo and social profiles.',
    permission: { settings: ['read'] },
    keywords: ['logo', 'favicon', 'business name', 'lottie', 'animated logo', 'social'],
    sections: [
      {
        title: 'Business',
        blocks: [
          {
            type: 'p',
            text: 'Set the **Business name** shown across the site. The **Legal name** is kept for legal pages. The insurance switch lives here too: see [The insurance page](/dashboard/help/insurance).',
          },
          { type: 'open', href: '/dashboard/settings/identity', label: 'Open Identity' },
        ],
      },
      {
        title: 'Logo and icons',
        blocks: [
          {
            type: 'list',
            items: [
              '**Logo**: shown in the header and footer.',
              '**Favicon**: the small icon in the browser tab. Use a square image of at least 512×512.',
              '**Animated logo**: upload a Lottie animation (.json) and turn on **Use the animated logo**. It falls back to the logo when off.',
            ],
          },
        ],
      },
      {
        title: 'Social profiles',
        blocks: [
          {
            type: 'p',
            text: 'Add each **Network** and its **Address**. The icons in the footer are managed separately under [Menus and footer](/dashboard/help/menus-and-footer).',
          },
        ],
      },
    ],
  },
  {
    slug: 'contact-details',
    group: 'settings',
    title: 'Phone, email, address and opening hours',
    description: 'The contact details that repeat across the whole site.',
    lead: '**Site settings**, **Contact** holds the details shown in the header, footer, Contact page and chat.',
    permission: { globals: ['read'] },
    keywords: ['phone', 'email', 'address', 'opening hours', 'whatsapp', 'eircode', 'map', 'bank holidays'],
    sections: [
      {
        title: 'Phone and email',
        blocks: [
          {
            type: 'list',
            items: [
              '**Phone (as shown)**: how the number appears, for example 01 234 5678.',
              '**Phone in international format**: the same number as +353…, used for tap-to-call.',
              '**Email**, **Emergency phone** and **WhatsApp number**.',
            ],
          },
          { type: 'open', href: '/dashboard/settings/contact', label: 'Open Contact details' },
        ],
      },
      {
        title: 'Address and map',
        blocks: [{ type: 'p', text: 'Fill in the **Address lines**, **Eircode** and a **Map link**.' }],
      },
      {
        title: 'Opening hours',
        blocks: [
          {
            type: 'p',
            text: 'Set the **Opening times** for each group of days. The **Bank holidays line** is hidden when left blank, and the summary is worked out from the times unless you write your own.',
          },
        ],
      },
      {
        title: 'After a change',
        blocks: [
          {
            type: 'callout',
            tone: 'tip',
            text: 'The chat assistant reads these details from its memory. After a change, sync it: see [Live chat AI](/dashboard/help/live-chat-ai).',
          },
        ],
      },
    ],
  },
  {
    slug: 'menus-and-footer',
    group: 'settings',
    title: 'Menus and footer',
    description: 'The header links, quote button and every part of the footer.',
    lead: '**Navigation** holds the header menu. **Footer** holds everything at the bottom of each page.',
    permission: { globals: ['read'] },
    keywords: ['menu', 'navigation', 'header', 'footer', 'links', 'copyright'],
    sections: [
      {
        title: 'Header menu',
        blocks: [
          {
            type: 'p',
            text: 'Under **Menu links**, each link has **Link text** and a **Link target**. Turn on **Mobile menu only** to hide it on large screens. **Quote button** sets the wording of every quote button on the site.',
          },
          { type: 'open', href: '/dashboard/settings/navigation', label: 'Open Navigation' },
        ],
      },
      {
        title: 'Footer',
        blocks: [{ type: 'p', text: 'The footer has a tab for each part.' }],
      },
      {
        title: 'Brand and social media',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: '**Brand** holds the text under the logo. **Social media** holds each profile’s name, link and icon.',
          },
        ],
      },
      {
        title: 'Link columns and contact',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: 'Add up to four **Link columns**, each with a title and links. The **Contact column** takes its phone, email and address from [Contact details](/dashboard/help/contact-details); you can add a note under them.',
          },
        ],
      },
      {
        title: 'Bottom bar',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: 'Set the **Copyright name** (blank uses the business name) and any small links. Published legal pages are added after them by themselves.',
          },
        ],
      },
    ],
  },
  {
    slug: 'forms-wording',
    group: 'settings',
    title: 'Form and button wording',
    description: 'The wording of the quote form, contact form and small labels.',
    lead: '**Forms** holds the wording of the quote form, the contact form and the small labels around the site.',
    permission: { globals: ['read'] },
    keywords: ['forms', 'microcopy', 'quote form', 'contact form', 'labels', 'success message'],
    sections: [
      {
        title: 'The three tabs',
        blocks: [
          {
            type: 'list',
            items: [
              '**Quote form**: field text, buttons, the reassurance lines and the message after sending. `{phone}` is replaced with the visitor’s number.',
              '**Contact form**: heading, fields, buttons and the message after sending. `{name}` is replaced with the visitor’s name.',
              '**Microcopy**: small labels, such as the opening hours card’s **open** and **closed** badges and the directions button.',
            ],
          },
          { type: 'open', href: '/dashboard/settings/forms', label: 'Open Forms' },
          {
            type: 'p',
            text: 'Each tab has its own save button and History. Changes go live as soon as you save.',
          },
        ],
      },
    ],
  },
  {
    slug: 'email-notifications',
    group: 'settings',
    title: 'Enquiry emails and auto-replies',
    description: 'Who is emailed about new enquiries and chats, and the customer auto-reply.',
    lead: '**Notifications** decides who is emailed when an enquiry arrives, and what the customer gets back.',
    permission: { settings: ['read'] },
    keywords: ['email', 'recipients', 'auto-reply', 'smtp', 'test email'],
    sections: [
      {
        title: 'Recipients',
        blocks: [
          {
            type: 'p',
            text: 'Add up to 10 addresses under **Recipients**. They are emailed about new enquiries and about chats that need a person.',
          },
          {
            type: 'p',
            text: '**Include the message in notification emails** is off by default, so the enquiry text stays inside the admin.',
          },
          { type: 'open', href: '/dashboard/settings/notifications', label: 'Open Notifications' },
        ],
      },
      {
        title: 'Auto-reply to the customer',
        blocks: [
          {
            type: 'p',
            text: 'Turn on **Send an auto-reply** and write a subject and message. The customer’s own enquiry text is never copied into it.',
          },
        ],
      },
      {
        title: 'Test the email',
        blocks: [
          {
            type: 'p',
            text: 'Press **Send test email** to send a message to your own address. "SMTP not configured" means email is not set up yet: ask your developer.',
          },
        ],
      },
    ],
  },
  {
    slug: 'data-retention',
    group: 'settings',
    title: 'Data retention',
    description: 'How long enquiries, chats and spam are kept.',
    lead: '**Privacy** sets how long the admin keeps personal data before deleting it.',
    permission: { settings: ['read'] },
    keywords: ['gdpr', 'retention', 'delete', 'privacy', 'months'],
    sections: [
      {
        title: 'The settings',
        blocks: [
          {
            type: 'list',
            items: [
              '**Keep enquiries for (months)**: 24 by default. Finished enquiries and live chats are deleted after this long.',
              '**Keep spam for (days)**: 30 by default.',
            ],
          },
          { type: 'open', href: '/dashboard/settings/privacy', label: 'Open Privacy' },
        ],
      },
      {
        title: 'What is never deleted',
        blocks: [
          {
            type: 'list',
            items: ['New and in-progress enquiries.', 'Quotes with invoice or payment records.'],
          },
          { type: 'p', text: 'The clean-up runs once a day, and each run is written to the Activity log.' },
        ],
      },
    ],
  },
  {
    slug: 'live-chat-ai',
    group: 'settings',
    title: 'Live chat AI',
    description: 'Let the AI answer chats, set its limits and keep its memory up to date.',
    lead: '**Live chat AI** decides whether the AI assistant answers website chats, and what it knows.',
    permission: { settings: ['read'] },
    keywords: ['ai', 'chatbot', 'bot', 'sync', 'memory', 'knowledge', 'hand over'],
    sections: [
      {
        title: 'Turn it on',
        blocks: [
          {
            type: 'steps',
            items: [
              'Make sure an AI provider is set up under [AI assistant](/dashboard/help/ai-assistant).',
              'Open **Site settings**, then **Live chat AI**.',
              'Turn on **Let the AI assistant answer live chats** and set the **Name shown to visitors**.',
              'Save, then press **Sync website data** (see below).',
            ],
          },
          { type: 'open', href: '/dashboard/settings/live-chat-ai', label: 'Open Live chat AI' },
          {
            type: 'callout',
            tone: 'note',
            text: 'Visitors are told they are talking to an AI, and chat text is sent to the AI provider. Turning it off does not end open chats: staff can still reply.',
          },
        ],
      },
      {
        title: 'Rules and limits',
        blocks: [
          {
            type: 'list',
            items: [
              '**Extra instructions** set the tone only. The AI never invents prices, approvals or promises.',
              '**Most AI replies per chat** (30 by default): after that, a team member is asked to take over.',
              'It also hands over when it cannot answer, or when the visitor wants a person, a quote or a booking. The team is emailed.',
            ],
          },
        ],
      },
      {
        title: 'AI memory',
        blocks: [
          {
            type: 'p',
            text: 'The AI answers from a copy of your services, prices, contact details, opening hours, process, projects, reviews and page text.',
          },
        ],
      },
      {
        title: 'Sync after changes',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: 'Press **Sync website data** whenever you change the website. A **Sync needed** badge appears when the memory is out of date, and "Last synced" shows when it last ran.',
          },
        ],
      },
    ],
  },
  {
    slug: 'ai-assistant',
    group: 'settings',
    title: 'AI assistant settings',
    description: 'Choose the AI provider and model, and who can use the assistant.',
    lead: '**AI assistant** connects an AI provider. It powers the chat assistant and the staff assistant in the admin, which can read the site but never change it.',
    permission: { ai: ['manage'] },
    keywords: ['ai', 'gemini', 'claude', 'openai', 'api key', 'model', 'provider'],
    sections: [
      {
        title: 'Connection',
        blocks: [
          {
            type: 'steps',
            items: [
              'Open **Site settings**, then **AI assistant**, and turn on **Turn on the AI assistant**.',
              'Pick a **Provider**: Google Gemini, Anthropic Claude or OpenAI-compatible.',
              'Paste your **API key**, press **List models** and pick a **Model**.',
              'Press **Save**, then **Test connection**.',
            ],
          },
          { type: 'open', href: '/dashboard/settings/ai-assistant', label: 'Open AI assistant' },
          {
            type: 'callout',
            tone: 'warning',
            text: 'On Gemini’s free tier Google may use prompts to improve its products. Don’t paste client details.',
          },
        ],
      },
      {
        title: 'Access',
        blocks: [
          {
            type: 'p',
            text: 'Under **Who can use it**, tick the roles allowed to use the staff assistant. Owners and admins can always use it.',
          },
        ],
      },
      {
        title: 'Reading enquiries',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: '**Let the assistant read enquiry details** is off by default. Only an owner can turn it on, after confirming data-protection approval.',
          },
        ],
      },
      {
        title: 'Behaviour',
        blocks: [
          {
            type: 'p',
            text: 'Add **Extra instructions** for tone, and set the **Longest answer**.',
          },
        ],
      },
    ],
  },
  {
    slug: 'appearance',
    group: 'settings',
    title: 'Change the colours and fonts',
    description: 'Colours and fonts for the site and the admin, with a contrast check.',
    lead: '**Appearance** sets the colours and fonts of the public site and the admin. Changes are a draft until you publish.',
    permission: { appearance: ['read'] },
    keywords: ['colours', 'colors', 'theme', 'brand', 'fonts', 'dark mode', 'contrast'],
    sections: [
      {
        title: 'Change the look',
        blocks: [
          {
            type: 'steps',
            items: [
              'Open **Appearance**. Changes save as a draft by themselves.',
              'On the **Site** tab, pick the **Brand** colour and the **Heading** and **Body** fonts.',
              'On the **Admin** tab, pick a preset or your own colours, the corner radius and the default light or dark mode.',
              'Press **Preview on site** to see the draft on the real website.',
              'Press **Publish**.',
            ],
          },
          { type: 'open', href: '/dashboard/appearance', label: 'Open Appearance' },
        ],
      },
      {
        title: 'Contrast check',
        blocks: [
          {
            type: 'p',
            text: 'Text must stay readable on its background. Any pair marked **Fails** blocks publishing. Press **Fix all** to adjust them, or pick a different colour.',
          },
        ],
      },
      {
        title: 'Undo',
        blocks: [
          {
            type: 'list',
            items: [
              '**Discard draft** throws away unpublished changes.',
              '**Reset to preset…** puts the draft back to a starting point.',
              '**History** lists earlier published versions; **Load into draft** brings one back.',
            ],
          },
        ],
      },
    ],
  },
];
