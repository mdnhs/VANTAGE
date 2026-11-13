import type { HelpArticle } from '../types';

export const WEBSITE_DOCS: readonly HelpArticle[] = [
  {
    slug: 'edit-a-page',
    group: 'website',
    title: 'Change the words or pictures on a page',
    description: 'Edit a page’s text, photos and videos with a live preview, then publish.',
    lead: '**Website** lists every page of the site. Each page has a **Page text** tab with the form on the left and a preview on the right.',
    permission: { page: ['read'] },
    keywords: ['home page', 'about', 'process', 'contact page', 'text', 'edit', 'publish', 'preview'],
    sections: [
      {
        title: 'Edit and publish',
        blocks: [
          {
            type: 'steps',
            items: [
              'Open **Website** and choose the page, for example **About** or **Process**.',
              'Use the **On this page** buttons above a long form to jump to a section.',
              'Change the text, photo or video. Your edits save as a draft and show in the **Preview**.',
              'Check the preview on Desktop, Tablet and Phone, or open it in a new tab.',
              'Press **Publish changes**. The page updates for visitors within a few seconds.',
            ],
          },
          { type: 'open', href: '/dashboard/website/about', label: 'Open About' },
          {
            type: 'callout',
            tone: 'note',
            text: 'While a draft exists, a yellow banner says "You have changes that are not live yet". Publish them, or press **Discard changes** to go back to the live text.',
          },
        ],
      },
      {
        title: 'Top banners',
        blocks: [
          {
            type: 'p',
            text: 'Most pages start with a banner: a small label, a title in two or three lines (some lines show in red), a line of text and a background.',
          },
        ],
      },
      {
        title: 'Video or photo background',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: 'Pick a **Background video** and a **Background photo**, then use **Play the video instead of the photo** to choose which one shows. The photo is also used while the video loads.',
          },
        ],
      },
      {
        title: 'Lists inside a page',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: 'Repeating items, such as team members or FAQ questions, have an **Add to …** button. Remove every item to hide that section.',
          },
        ],
      },
      {
        title: 'What each page holds',
        blocks: [
          {
            type: 'list',
            items: [
              '**About**: the top banner, **Our story** (with two numbers and a quote), the **Team** and **Our standards**. Empty photos fall back to built-in pictures.',
              '**Process**: the top banner. In the title, `{count}` becomes the number of steps switched on. The steps themselves are on the **Steps** tab.',
              '**Contact**: the top banner only. The phone, email, address and opening hours come from [Site settings](/dashboard/help/contact-details).',
              '**Insurance**: see [The insurance page](/dashboard/help/insurance).',
            ],
          },
        ],
      },
      {
        title: 'Undo a change',
        blocks: [
          {
            type: 'p',
            text: 'Press **History** to see the last 20 saves and **Restore** an earlier one.',
          },
        ],
      },
    ],
  },
  {
    slug: 'home-page',
    group: 'website',
    title: 'Edit the home page',
    description: 'The banner, service cards, quote form, steps, reviews and partner logos.',
    lead: '**Home page** has one tab for each part of the homepage, in the order visitors see them.',
    permission: { page: ['read'] },
    keywords: ['homepage', 'catalog', 'service cards', 'reviews', 'testimonials', 'partner logos', 'steps', 'trust'],
    sections: [
      {
        title: 'The tabs',
        blocks: [
          {
            type: 'list',
            items: [
              '**Top banner & text**: the banner, the four facts in the trust ticker, and the headings above the services and the quote form. Draft, then **Publish changes**.',
              '**Service cards**: the cards in the services grid.',
              '**Quote form**: the form’s wording, and the banner on the Get a quote page.',
              '**Process steps**: the numbered steps, shared with the Process page.',
              '**Reviews**: customer testimonials.',
              '**Partner logos**: insurer and partner logos.',
              '**Search & sharing**: how the homepage looks on Google. See [Search and sharing for a page](/dashboard/help/page-seo).',
            ],
          },
          { type: 'open', href: '/dashboard/website/home-page', label: 'Open Home page' },
        ],
      },
      {
        title: 'Lists: cards, steps, reviews and logos',
        blocks: [
          {
            type: 'p',
            text: 'These four tabs are lists. Each row has up and down arrows to change the order (it saves straight away), a switch to show or hide it, a pencil to edit and a bin to delete.',
          },
        ],
      },
      {
        title: 'Service cards',
        level: 3,
        blocks: [
          {
            type: 'steps',
            items: [
              'Press **Add catalog item**.',
              'Fill in the **Title** and **Description**, and optionally a **Badge** and a **Footnote** (for example "Free Estimate").',
              'Pick a **Preset Icon**, or upload a **Custom Icon Image** instead.',
              'Leave **Visible on homepage catalog** on, then press **Create catalog item**.',
            ],
          },
        ],
      },
      {
        title: 'Process steps',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: 'Press **Add step** and give it a **Title** and **Description**. **Highlight this step** shows it in the accent colour. The same steps appear on the Process page.',
          },
        ],
      },
      {
        title: 'Reviews',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: 'Press **Add testimonial** and enter the **Customer name**, **Rating** and **Review**. New reviews are published straight away. Turn on **Feature on homepage**, or press the star in the list, to show it on the homepage.',
          },
          {
            type: 'callout',
            tone: 'warning',
            text: 'Only add real reviews from real customers, worded as they wrote them.',
          },
        ],
      },
      {
        title: 'Partner logos',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: 'Press **Add logo**, enter the **Company name**, choose the **Logo** and, if you like, the company’s **Website URL**. Logos show on the homepage and the insurance page.',
          },
        ],
      },
      {
        title: 'The quote form',
        blocks: [
          {
            type: 'p',
            text: 'The **Quote form** tab has two parts. **Quote form** holds the field text, buttons and the message after sending; it goes live as soon as you press **Save quote form**. **Get a quote page** holds that page’s banner and uses draft and publish.',
          },
        ],
      },
    ],
  },
  {
    slug: 'services',
    group: 'website',
    title: 'Add or edit a service',
    description: 'Each service has its own page plus a card on the Services page.',
    lead: '**Services** holds the Services page text, the list of services and their search settings.',
    permission: { content: ['read'] },
    keywords: ['service', 'repair', 'card', 'order', 'faq'],
    sections: [
      {
        title: 'Add a service',
        blocks: [
          {
            type: 'steps',
            items: [
              'Open **Website**, then **Services**, and press **Add service**.',
              'Fill in the **Name**. The **Page address** fills in by itself (/services/…); change it only if you need to.',
              'Write a **Short description** and up to 10 lines under **What’s included**, one per line.',
              'Choose an **Icon** and a **Photo**, and write the longer text under **More about this service**.',
              'Leave **Show on the website** on to publish it, or off to keep it as a draft. Press **Create service**.',
            ],
          },
          { type: 'open', href: '/dashboard/website/services', label: 'Open Services' },
        ],
      },
      {
        title: 'Order, hide or delete',
        blocks: [
          {
            type: 'p',
            text: 'On the **Services** tab, use the arrows to change the order, the switch to move a service between **Published** and **Draft**, and the bin to delete it.',
          },
        ],
      },
      {
        title: 'The Services page text',
        blocks: [
          {
            type: 'p',
            text: 'The **Page text** tab holds the banner and the **FAQ** questions. Remove every question to hide the FAQ.',
          },
        ],
      },
      {
        title: 'Search settings for one service',
        blocks: [
          {
            type: 'p',
            text: 'Each service has its own **Search & sharing** tab. See [Search and sharing for a page](/dashboard/help/page-seo).',
          },
        ],
      },
    ],
  },
  {
    slug: 'our-work',
    group: 'website',
    title: 'Show your work and projects',
    description: 'Add finished jobs with before and after pictures.',
    lead: '**Our work** holds finished jobs, each with before and after pictures and a gallery.',
    permission: { content: ['read'] },
    keywords: ['projects', 'gallery', 'before', 'after', 'portfolio', 'featured'],
    sections: [
      {
        title: 'Add a project',
        blocks: [
          {
            type: 'steps',
            items: [
              'Open **Website**, then **Our work**, and press **Add project**.',
              'Fill in the **Title**, **Vehicle model**, **Category** and **Description**.',
              'Choose a **Before** and an **After** image. Both are required.',
              'Add up to 10 more pictures to the **Gallery**, and the date it was **Completed on**.',
              'Press **Create project**. New projects start as **draft**.',
            ],
          },
          { type: 'open', href: '/dashboard/website/projects', label: 'Open Our work' },
        ],
      },
      {
        title: 'Publish and feature',
        blocks: [
          {
            type: 'p',
            text: 'In the **Projects** list, turn the switch on to publish a project. Press the star (or turn on **Feature on homepage**) to show it on the homepage.',
          },
        ],
      },
      {
        title: 'Authors',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: 'Authors can add projects and edit their own drafts. Someone with more access publishes them.',
          },
        ],
      },
      {
        title: 'Good pictures',
        blocks: [
          {
            type: 'callout',
            tone: 'tip',
            text: 'Take the before and after photos from the same angle and in similar light, so the difference is easy to see.',
          },
        ],
      },
    ],
  },
  {
    slug: 'legal-pages',
    group: 'website',
    title: 'Privacy policy and other legal pages',
    description: 'Write the privacy policy, terms and other pages linked from the footer.',
    lead: '**Legal pages** holds the privacy policy, terms and similar pages. Published ones are linked from the footer, in the order of this list.',
    permission: { content: ['read'] },
    keywords: ['privacy', 'terms', 'cookies', 'gdpr', 'footer'],
    sections: [
      {
        title: 'Add or edit a legal page',
        blocks: [
          {
            type: 'steps',
            items: [
              'Open **Website**, then **Legal pages**, and press **Add legal page** or the pencil on a page.',
              'Enter the **Title** and the **Address** (for example /privacy-policy).',
              'Write the text in the **Content** editor, with headings, lists and links.',
              'Turn on **Published** to show it on the site and in the footer. New pages start as Draft.',
              'Press **Create page** or **Save changes**.',
            ],
          },
          { type: 'open', href: '/dashboard/website/legal-pages', label: 'Open Legal pages' },
        ],
      },
      {
        title: 'Changing the address',
        blocks: [
          {
            type: 'p',
            text: 'If you change the address of a published page, the old address redirects to the new one by itself.',
          },
          {
            type: 'callout',
            tone: 'warning',
            text: 'Legal wording matters. If you are not sure about a change, check it with whoever advises the business before saving.',
          },
        ],
      },
    ],
  },
  {
    slug: 'insurance',
    group: 'website',
    title: 'The insurance page',
    description: 'Turn the insurance page on or off and edit its wording.',
    lead: 'The Insurance page explains how you help with insurance claims. It is off until you turn it on.',
    permission: { page: ['read'] },
    keywords: ['insurance', 'claim', 'insurer'],
    sections: [
      {
        title: 'Turn it on or off',
        blocks: [
          {
            type: 'steps',
            items: [
              'Open **Site settings**, then **Identity**.',
              'Under **Business**, switch **Show the Insurance page and insurance wording**.',
              'Press **Save identity**.',
            ],
          },
          { type: 'open', href: '/dashboard/settings/identity', label: 'Open Identity' },
          {
            type: 'p',
            text: 'Off hides the Insurance page, its menu links, the insurance wording on the site and the chat assistant’s insurance help. The **Insurance** item also leaves the admin menu.',
          },
        ],
      },
      {
        title: 'Edit the page',
        blocks: [
          {
            type: 'p',
            text: 'With it on, open **Website**, then **Insurance**. The **Page text** tab holds the banner, up to six **Why us** cards, the **Claim steps**, the closing call to action and the small print. It uses draft and publish like every page.',
          },
          {
            type: 'callout',
            tone: 'tip',
            text: 'The insurer logos are edited under **Home page**, **Partner logos**.',
          },
        ],
      },
    ],
  },
];
