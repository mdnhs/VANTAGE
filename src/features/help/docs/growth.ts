import type { HelpArticle } from '../types';

export const GROWTH_DOCS: readonly HelpArticle[] = [
  {
    slug: 'seo-overview',
    group: 'growth',
    title: 'Fix SEO issues',
    description: 'Read the SEO health score and fix what it flags.',
    lead: '**SEO** checks every public page the way a search engine would and lists what to fix.',
    permission: { seo: ['read'] },
    keywords: ['google', 'search', 'health', 'issues', 'score', 'checks'],
    sections: [
      {
        title: 'The overview',
        blocks: [
          {
            type: 'list',
            items: [
              '**SEO health**: how many checks pass across the main pages.',
              '**Alt text**: how many images are described. **Find images without alt text** opens Media with the filter on.',
              '**Issues**: each problem, grouped by page, with a **Fix** button that opens the right screen.',
            ],
          },
          { type: 'open', href: '/dashboard/seo', label: 'Open SEO' },
        ],
      },
      {
        title: 'Common issues',
        blocks: [
          {
            type: 'list',
            items: [
              '**Title is N characters**: aim for 30–60 characters.',
              '**Another page has the same title**: give each page its own.',
              '**Add a meta description** or **Description is N characters**: aim for 70–160.',
              '**Share image should be at least 1200×630**: pick a larger image.',
              '**Images missing alt text**: describe them in Media.',
              '**Hidden from search engines**: someone turned on "Hide from search engines" for that page.',
            ],
          },
        ],
      },
      {
        title: 'Search engines are blocked',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: 'This one has no Fix button: it means the site is not running as the live site (for example on a test copy). Ask your developer if you see it on the real website.',
          },
        ],
      },
    ],
  },
  {
    slug: 'page-seo',
    group: 'growth',
    title: 'Search and sharing for a page',
    description: 'Set the title, description and share image for one page.',
    lead: 'Every page, service, project and legal page has a **Search & sharing** tab. It controls how that page looks in Google and when shared on social media.',
    permission: { seo: ['read'] },
    keywords: ['seo title', 'meta description', 'og', 'social', 'share image', 'canonical', 'noindex'],
    sections: [
      {
        title: 'The fields',
        blocks: [
          {
            type: 'list',
            items: [
              '**SEO title** (up to 70 characters, aim for 30–60): the blue link in Google.',
              '**Meta description** (up to 200, aim for 70–160): the text under it.',
              '**Social title**, **Social description** and **Social share image**: what shows when the page is shared. Use an image at least 1200×630.',
              '**Canonical address**: leave empty unless a developer asks you to set it.',
              '**Hide from search engines**: keeps the page out of Google. Leave it off for normal pages.',
            ],
          },
          { type: 'p', text: 'Empty fields fall back to the [SEO defaults](/dashboard/help/seo-defaults).' },
        ],
      },
      {
        title: 'Previews and checks',
        blocks: [
          {
            type: 'p',
            text: 'On a page’s **Search & sharing** tab, **In search results** and **When shared** preview the result as you type, and **Checks** tick off each rule.',
          },
        ],
      },
      {
        title: 'Saving',
        blocks: [
          {
            type: 'p',
            text: 'On a page, press **Save … SEO**: it goes live straight away, with no draft. On a service, project or legal page, the fields save with the record’s own **Save changes** button.',
          },
        ],
      },
    ],
  },
  {
    slug: 'seo-defaults',
    group: 'growth',
    title: 'SEO defaults and business details',
    description: 'Site-wide titles, search console codes and business details for Google.',
    lead: '**SEO**, **Defaults** holds the wording used when a page has none of its own, plus the business details search engines read.',
    permission: { seo: ['read'] },
    keywords: ['defaults', 'title template', 'search console', 'bing', 'structured data', 'llms', 'robots', 'sitemap'],
    sections: [
      {
        title: 'Titles and descriptions',
        blocks: [
          {
            type: 'list',
            items: [
              '**Title template**: `%s` is replaced by the page title, for example "%s | Auto Paint Shop".',
              '**Default title**, **Default description** and **Default share image**: used when a page leaves them empty.',
            ],
          },
          { type: 'open', href: '/dashboard/seo/defaults', label: 'Open SEO defaults' },
        ],
      },
      {
        title: 'Verification codes',
        blocks: [
          {
            type: 'p',
            text: 'Paste the codes Google Search Console and Bing Webmaster give you into **Google Search Console code** and **Bing Webmaster code**.',
          },
        ],
      },
      {
        title: 'Business details',
        blocks: [
          {
            type: 'p',
            text: 'These help Google show the business in local results: **Business type**, **Price range**, **Areas served**, **Other profiles**, and the map position (**Latitude** and **Longitude**: right-click your pin in Google Maps to copy them).',
          },
          {
            type: 'callout',
            tone: 'warning',
            text: 'Only enter the **Google rating** and **Number of reviews** shown on your Google profile. They must match real reviews.',
          },
        ],
      },
      {
        title: 'What crawlers see',
        blocks: [
          {
            type: 'p',
            text: 'Below the form, **What crawlers see** shows the robots.txt file and the sitemap, with a link to open each.',
          },
        ],
      },
    ],
  },
  {
    slug: 'redirects',
    group: 'growth',
    title: 'Redirect old addresses',
    description: 'Send old links to the right page so nothing breaks.',
    lead: '**Redirects** sends visitors and search engines from an old address to a new one.',
    permission: { redirect: ['read'] },
    keywords: ['redirect', '301', 'old link', 'broken link', 'www'],
    sections: [
      {
        title: 'Add a redirect',
        blocks: [
          {
            type: 'steps',
            items: [
              'Open **SEO**, then **Redirects**, and press **New redirect**.',
              'Enter **From** (the old path, for example /old-page) and **To** (the new page).',
              'Keep **301 Permanent** unless the move is only temporary. Add a **Note** if useful.',
              'Press **Save**.',
            ],
          },
          { type: 'open', href: '/dashboard/seo/redirects', label: 'Open Redirects' },
          {
            type: 'callout',
            tone: 'note',
            text: 'From addresses are case-sensitive. You cannot redirect the home page or a page that is live, and loops are refused.',
          },
        ],
      },
      {
        title: 'Manage redirects',
        blocks: [
          {
            type: 'p',
            text: 'The list shows how often each redirect is used (**Hits** and **Last hit**). Use **Turn off** to pause one, or **Delete** to remove it.',
          },
        ],
      },
      {
        title: 'With or without www',
        blocks: [
          {
            type: 'p',
            text: '**Preferred address** sends every visitor to one form of the domain, with or without www. Only change it if the site’s certificate covers both.',
          },
        ],
      },
    ],
  },
  {
    slug: 'tracking',
    group: 'growth',
    title: 'Analytics and tracking',
    description: 'Connect Google Tag Manager, GA4 and the Meta Pixel.',
    lead: '**Marketing**, **Tracking** connects your analytics. Nothing loads for a visitor until they accept cookies.',
    permission: { tracking: ['read'] },
    keywords: [
      'analytics',
      'google analytics',
      'ga4',
      'gtm',
      'tag manager',
      'meta pixel',
      'facebook',
      'conversions api',
    ],
    sections: [
      {
        title: 'Connect your tools',
        blocks: [
          {
            type: 'steps',
            items: [
              'Open **Marketing**. Enter your **GTM container ID** and turn on **Load Google Tag Manager**.',
              'For Google Analytics, enter the **GA4 measurement ID** and turn on **Send GA4 through GTM**.',
              'For Meta, enter the **Meta Pixel ID** and turn on **Load the Meta Pixel**.',
              'Press **Save tracking**.',
            ],
          },
          { type: 'open', href: '/dashboard/marketing', label: 'Open Tracking' },
        ],
      },
      {
        title: 'Check the status',
        blocks: [
          {
            type: 'p',
            text: 'The **Status** panel shows each tool as **Ready** or what it still needs, for example **Add the ID** or **Turn on the consent banner**. Tracking only runs while the [consent banner](/dashboard/help/consent-banner) is on.',
          },
        ],
      },
      {
        title: 'Meta Conversions API',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: 'To send leads to Meta from the server, turn on **Send leads with the Conversions API** and add the access token. Use **Send test event** to check it works.',
          },
        ],
      },
      {
        title: 'Enhanced matching',
        level: 3,
        blocks: [
          {
            type: 'callout',
            tone: 'warning',
            text: 'Sending hashed email and phone numbers needs data-protection approval first. Only an owner can turn it on.',
          },
        ],
      },
      {
        title: 'Event catalogue',
        blocks: [
          {
            type: 'p',
            text: '**Event catalogue** lists what the site reports: page views, leads (form sent) and contact clicks (phone, email or WhatsApp).',
          },
        ],
      },
    ],
  },
  {
    slug: 'consent-banner',
    group: 'growth',
    title: 'The cookie consent banner',
    description: 'Turn on the cookie banner and change its wording.',
    lead: '**Consent banner** asks visitors whether they accept analytics and marketing cookies.',
    permission: { tracking: ['read'] },
    keywords: ['cookies', 'consent', 'gdpr', 'banner'],
    sections: [
      {
        title: 'Set it up',
        blocks: [
          {
            type: 'steps',
            items: [
              'Open **Marketing**, then **Consent banner**.',
              'Fill in the **Title**, **Text**, button labels and the privacy policy link.',
              'Turn on **Show the consent banner** and save. Every label must be filled in first.',
            ],
          },
          { type: 'open', href: '/dashboard/marketing/consent', label: 'Open Consent banner' },
          {
            type: 'p',
            text: 'The **Preview** on the right shows both the first layer and the **Customise** view.',
          },
        ],
      },
      {
        title: 'Asking again',
        blocks: [
          {
            type: 'p',
            text: '**Ask again after (months)** sets how long a choice lasts. Raising the **Version** asks every visitor again, for example after you add a new tracking tool.',
          },
        ],
      },
    ],
  },
  {
    slug: 'custom-code',
    group: 'growth',
    title: 'Custom code',
    description: 'Add a third-party script to the site (owners only).',
    lead: '**Custom code** adds a script, such as a chat or review widget, to the public site. Only owners can open it.',
    permission: { code: ['update'] },
    keywords: ['script', 'code', 'snippet', 'head', 'body'],
    sections: [
      {
        title: 'Add a snippet',
        blocks: [
          {
            type: 'steps',
            items: [
              'Open **Marketing**, then **Custom code**, and add a snippet.',
              'Give it a **Name**, choose **Where it goes** and paste the **Inline code**.',
              'Pick the **Consent category**: anything except "necessary" runs only after the visitor agrees.',
              'Limit it to some **Pages** if needed (blank runs everywhere), turn it on and save.',
            ],
          },
          { type: 'open', href: '/dashboard/marketing/code', label: 'Open Custom code' },
        ],
      },
      {
        title: 'Stay safe',
        blocks: [
          {
            type: 'callout',
            tone: 'warning',
            text: 'Custom code runs on every visitor’s page, including the enquiry forms. Only add code from a source you trust. To stop a snippet at once, remove it and save.',
          },
        ],
      },
    ],
  },
];
