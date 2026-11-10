import type { FieldOverrides } from '@/components/admin/schema-form/to-fields';
import type { EditableGlobalKey } from '@/lib/content/global-access';
import { SEO_PAGE_FIELD_UI } from '@/features/seo/seo-field-ui';
import { MARKETING_FIELD_UI } from '@/features/marketing/marketing-field-ui';

// Shared wording for the copy every page section repeats, so the same thing has one name.
const BADGE = {
  label: 'Small label above the title',
  description: 'The short pill-shaped tag over the title.',
  widget: 'text',
} as const;
const SUBTEXT = { label: 'Text under the title' } as const;

// Admin labels and hints per global, as SchemaForm overrides keyed by dotted
// path ("links.$.label" is a list item's field). Plain data on purpose: the
// shared image/video ref schemas must not be re-registered, so labels for them
// live here. Keys not listed fall back to a humanised field name.
export const GLOBAL_FIELD_UI: Partial<Record<EditableGlobalKey, FieldOverrides>> = {
  site: {
    name: {
      label: 'Business name',
      widget: 'text',
      section: 'Business',
      sectionDescription: 'Who the business is. The name appears across the site, in page titles and in emails.',
    },
    legalName: {
      label: 'Legal name',
      description: 'Used in legal pages and invoices (not shown on the site yet).',
      section: 'Business',
    },
    logo: {
      label: 'Logo',
      section: 'Logo & icons',
      sectionDescription: 'The logo in the header and footer, and the small icon in browser tabs.',
    },
    favicon: { label: 'Favicon', section: 'Logo & icons' },
    lottieLogo: { label: 'Animated logo', section: 'Logo & icons' },
    'lottieLogo.enabled': { label: 'Use the animated logo', description: 'Falls back to the logo when off.' },
    'lottieLogo.json': {
      widget: 'json-file',
      label: 'Lottie animation',
      description: 'A .json file exported from Lottie.',
    },
    social: {
      label: 'Social profiles',
      section: 'Social profiles',
      sectionDescription:
        'Your profiles by network and address. The icons shown in the footer are managed under Settings > Footer > Social media.',
    },
    'social.$.label': { label: 'Network' },
    'social.$.url': { label: 'Address', inputType: 'url', placeholder: 'https://' },
  },
  contact: {
    phone: {
      label: 'Phone',
      section: 'Phone & email',
      sectionDescription: 'How customers reach you. These appear in the header, footer and on the Contact page.',
    },
    email: { inputType: 'email', label: 'Email', section: 'Phone & email' },
    'phone.display': { label: 'Phone (as shown)' },
    'phone.e164': {
      label: 'Phone in international format (E.164)',
      placeholder: '+35312345678',
      description: 'Used for phone links on the site when valid (e.g. +35312345678). Falls back to the display number.',
    },
    emergencyPhone: { label: 'Emergency phone', inputType: 'tel', section: 'Phone & email' },
    whatsapp: { label: 'WhatsApp number', inputType: 'tel', section: 'Phone & email' },
    address: {
      label: 'Address',
      section: 'Address & map',
      sectionDescription: 'Where the workshop is. Shown in the footer and on the Contact page.',
    },
    'address.lines': { label: 'Address lines' },
    'address.eircode': { label: 'Eircode' },
    hours: {
      label: 'Opening hours',
      section: 'Opening hours',
      sectionDescription: 'When the workshop is open.',
    },
    'hours.weekly': { widget: 'weekly-hours-groups', label: 'Opening times' },
    'hours.note': { description: 'Internal note about the hours (not shown on the site yet).' },
    'hours.bankHolidays': {
      label: 'Bank holidays line',
      description:
        'The last row of the opening-hours card on the Contact page, for example "Crash line only". Leave blank to hide the row.',
    },
    'hours.summary': { description: 'Leave blank to generate it from the opening times.' },
    mapUrl: { label: 'Map link', inputType: 'url', placeholder: 'https://', section: 'Address & map' },
  },
  navigation: {
    links: {
      label: 'Header links',
      section: 'Menu links',
      sectionDescription: 'The links in the header and in the mobile menu.',
    },
    'links.$.label': { label: 'Link text' },
    'links.$.href': { label: 'Link target', widget: 'text' },
    'links.$.mobileOnly': { label: 'Mobile menu only' },
    cta: {
      label: 'Quote button',
      section: 'Quote button',
      sectionDescription:
        'One wording for every "get a quote" button on the site (home hero, closing banner, service pages, mobile menu). The other fields are kept but no longer used.',
    },
    'cta.label': { label: 'Button text', description: 'e.g. Get a Free Quote. Shown on every quote button.' },
    'cta.href': { label: 'Link (not used)', widget: 'text' },
    'cta.shortLabel': { label: 'Short label (not used)' },
    'cta.mobileLabel': { label: 'Mobile menu label (not used)' },
    'cta.mobileHref': { label: 'Mobile menu link (not used)', widget: 'text' },
  },
  footer: {
    // Brand: the logo column on the left of the footer.
    blurb: {
      label: 'Text under the logo',
      description: 'A short line about the business.',
      section: 'Brand',
      sectionDescription: 'The logo column at the left of the footer: the short text under the logo.',
    },
    socials: {
      label: 'Social media',
      description: 'Add a profile, give it a name and link, and upload its icon.',
      section: 'Social media',
      sectionDescription: 'Icons shown under the text in the logo column, one for each profile you add.',
    },
    'socials.$': { label: 'Profile' },
    'socials.$.name': { label: 'Name', placeholder: 'Facebook' },
    'socials.$.url': { label: 'Link', widget: 'text', inputType: 'url', placeholder: 'https://facebook.com/yourpage' },
    'socials.$.icon': {
      label: 'Icon',
      description:
        'A small square image, SVG or PNG. It sits on a white tile, so use a dark or coloured icon. Without one, the first letter of the name shows.',
    },
    // Link columns: up to four, after the brand column.
    columns: {
      label: 'Link columns',
      description: 'Each column has a title and its own links.',
      section: 'Link columns',
      sectionDescription: 'The columns of links next to the logo column, such as Services and Company. Up to 4.',
    },
    'columns.$.title': { label: 'Column title' },
    'columns.$.links': { label: 'Links' },
    'columns.$.links.$': { widget: 'link' },
    // Contact: the column at the right.
    contactNote: {
      label: 'Note under the contact details',
      description: 'Optional small print, for example "Emergency callouts 24/7".',
      section: 'Contact column',
      sectionDescription:
        'The Contact column lists the phone, email and address from Settings > Contact. You can only add a note here.',
    },
    // Bottom bar: the line along the very bottom.
    copyrightName: {
      label: 'Copyright name',
      description: 'Blank uses the business name.',
      section: 'Bottom bar',
      sectionDescription: 'The line along the very bottom: the copyright text on the left, small links on the right.',
    },
    legalNote: {
      label: 'Text after the copyright',
      description: 'Printed after the copyright name.',
      section: 'Bottom bar',
    },
    legalLinks: {
      label: 'Small links',
      description:
        'Shown at the right of the bottom bar. Your published legal pages are added after these automatically (Website > Legal pages).',
      section: 'Bottom bar',
    },
    'legalLinks.$': { widget: 'link' },
  },
  quoteForm: {
    steps: {
      section: 'Steps',
      sectionDescription: 'The three steps shown above the quote form. They follow the visitor down the single form.',
    },
    labels: {
      section: 'Field text',
      sectionDescription: 'The labels, example text and hints for the quote form fields.',
    },
    placeholders: { section: 'Field text' },
    hints: { section: 'Field text' },
    buttons: {
      section: 'Buttons',
      sectionDescription: 'The text on the quote form buttons.',
    },
    responseTime: {
      section: 'Reassurance',
      sectionDescription: 'The short reassurances shown beside the form, and the privacy note under it.',
    },
    noCard: { section: 'Reassurance' },
    benefits: { section: 'Reassurance' },
    privacyNote: { section: 'Reassurance' },
    success: {
      section: 'After sending',
      sectionDescription: 'What visitors see once they send the form, or when something goes wrong.',
    },
    errors: { section: 'After sending' },
    'success.body': { description: '"{name}", "{vehicle}" and "{phone}" are replaced.' },
  },
  contactForm: {
    title: {
      section: 'Heading',
      sectionDescription: 'The heading and introduction above the contact form.',
    },
    intro: { section: 'Heading' },
    labels: {
      section: 'Fields',
      sectionDescription: 'The labels, example text and photo drop area of the contact form.',
    },
    placeholders: { section: 'Fields' },
    dropzone: { section: 'Fields' },
    button: {
      section: 'Buttons & notes',
      sectionDescription: 'The send button and the small notes around it.',
    },
    submitting: { section: 'Buttons & notes' },
    responseNote: { section: 'Buttons & notes' },
    sendAnother: { section: 'Buttons & notes' },
    success: {
      section: 'After sending',
      sectionDescription: 'What visitors see once they send the form, or when something goes wrong.',
    },
    errors: { section: 'After sending' },
    'success.body': { description: '"{name}" is replaced.' },
  },
  microcopy: {
    contactInfo: {
      section: 'Contact info',
      sectionDescription: 'The details cards on the Contact page: headings and labels.',
    },
    visitUs: {
      section: 'Visit us',
      sectionDescription: 'The map section at the bottom of the Contact page.',
    },
    'visitUs.hoursTitle': { label: 'Opening hours card: title', section: 'Visit us' },
    'visitUs.openNow': {
      label: 'Opening hours card: open badge',
      description: 'Shown while the workshop is open, using the opening times in Settings > Contact.',
      section: 'Visit us',
    },
    'visitUs.closedNow': {
      label: 'Opening hours card: closed badge',
      description: 'Shown outside the opening times.',
      section: 'Visit us',
    },
    'visitUs.closedDay': {
      label: 'Opening hours card: closed day',
      description: 'Printed for days with no opening times, for example "Closed".',
      section: 'Visit us',
    },
    'visitUs.bankHolidaysLabel': {
      label: 'Opening hours card: bank holidays label',
      description: 'The text of the row itself is set in Settings > Contact > Opening hours.',
      section: 'Visit us',
    },
    'visitUs.directionsLabel': {
      label: 'Opening hours card: directions button',
      description: 'Opens the map address from Settings > Contact, or a map search for the address.',
      section: 'Visit us',
    },
  },
  notifications: {
    recipients: {
      label: 'Recipients',
      description: 'New enquiries are emailed to these addresses.',
      section: 'Recipients',
      sectionDescription: 'Who is emailed when a new enquiry arrives.',
    },
    includeMessage: {
      label: 'Include the message in notification emails',
      description: 'Off by default: email copies leave the admin.',
      section: 'Recipients',
    },
    autoReply: {
      label: 'Auto-reply to the customer',
      section: 'Auto-reply',
      sectionDescription: 'An automatic reply sent to the customer after they send an enquiry.',
    },
    'autoReply.enabled': {
      label: 'Send an auto-reply',
      description: 'Auto-replies go to whatever address is typed into the form.',
    },
    'autoReply.body': { description: 'The enquiry text is never added to the auto-reply.' },
  },
  seo: {
    titleTemplate: {
      label: 'Title template',
      description: '"%s" is replaced by the page title. Blank uses "%s | business name".',
    },
    defaultTitle: { label: 'Default title', description: 'Blank uses the business name.' },
    defaultDescription: {
      label: 'Default description',
      description: 'Blank uses the business name and opening hours.',
    },
    defaultOgImage: { label: 'Default share image' },
    twitterHandle: { label: 'X / Twitter handle' },
    'verification.google': { label: 'Google Search Console code' },
    'verification.bing': { label: 'Bing Webmaster code' },
    business: { label: 'Business details (structured data)' },
    'business.type': {
      label: 'Business type',
      widget: 'select',
      options: [
        { value: 'AutoBodyShop', label: 'Auto body shop' },
        { value: 'AutoRepair', label: 'Auto repair' },
        { value: 'LocalBusiness', label: 'Local business' },
      ],
    },
    'business.priceRange': { label: 'Price range', placeholder: '€€' },
    'business.sameAs': { label: 'Other profiles' },
    llms: {
      label: 'AI assistants (llms.txt)',
      description: 'A plain-text summary of the site at /llms.txt that AI search tools read.',
    },
    'llms.enabled': { label: 'Publish /llms.txt' },
    'llms.summary': {
      label: 'Summary',
      widget: 'textarea',
      description: 'Who you are and what you do, in a few sentences. Blank uses the default description.',
    },
  },
  supportBot: {
    enabled: {
      section: 'Assistant',
      sectionDescription:
        'An AI assistant answers new live chats first, using your services, contact details and reviews. Staff see every chat and can take over at any time. It needs an AI provider under AI assistant settings.',
      label: 'Let the AI assistant answer live chats',
      description:
        'Visitors are told it is an AI. Chat text is sent to the AI provider you chose. Turning this off does not end chats already open: staff can still reply.',
    },
    botName: {
      section: 'Assistant',
      label: 'Name shown to visitors',
      description: 'Keep it clear that this is an AI.',
    },
    extraInstructions: {
      section: 'Assistant',
      label: 'Extra instructions',
      description:
        'Tone and focus only (for example "keep answers under three sentences"). It cannot override the safety rules: no invented prices, approvals or promises.',
    },
    maxAiReplies: {
      section: 'Limits',
      sectionDescription: 'After this many AI replies in one chat, a team member is asked to take over.',
      label: 'Most AI replies per chat',
    },
  },
  privacy: {
    enquiryRetentionMonths: {
      section: 'Enquiries',
      sectionDescription: 'How long finished enquiries are kept before they are deleted.',
      label: 'Keep enquiries for (months)',
      description:
        'Only finished enquiries are deleted, counted from their last update: completed, cancelled or archived quotes with no billing data (no invoice number, status unpaid, nothing paid, no payment method), and replied or archived contact messages. New and in-progress enquiries are never deleted.',
    },
    spamRetentionDays: {
      section: 'Spam',
      sectionDescription: 'How long enquiries filed as spam are kept before they are deleted.',
      label: 'Keep spam for (days)',
      description:
        'Applies to enquiries filed as spam, counted from their last update. A quote with invoice or payment records is never deleted.',
    },
  },
  'page.home': {
    hero: {
      label: 'Top banner',
      description: 'The first thing visitors see on the homepage, over the video or photo.',
    },
    'hero.eyebrow': BADGE,
    'hero.line1': { label: 'Title — line 1', description: 'White.' },
    'hero.line2': { label: 'Title — line 2', description: 'White.' },
    'hero.accent': { label: 'Title — line 3', description: 'Red.' },
    'hero.subtext': SUBTEXT,
    'hero.video': { label: 'Background video', description: 'Plays behind the title when switched on below.' },
    'hero.fallbackImage': {
      label: 'Background photo',
      description: 'Shown when the video is off, and while it loads on slow connections.',
    },
    'hero.videoEnabled': { label: 'Play the video instead of the photo' },
    trustBadges: {
      label: 'Trust ticker',
      description:
        'The 4 short facts scrolling under the banner buttons. Icons follow the order and cannot be changed.',
    },
    'trustBadges.$': { label: 'Fact' },
    'trustBadges.$.title': { label: 'Main text' },
    'trustBadges.$.subtitle': { label: 'Small text under it' },
    catalog: { label: 'Services grid heading', description: 'The heading above the grid of service cards.' },
    'catalog.eyebrow': BADGE,
    'catalog.line1': { label: 'Title', description: 'White.' },
    'catalog.accent': { label: 'Title — red part', description: 'Red, after the white part.' },
    'catalog.subtext': SUBTEXT,
    quoteSection: {
      label: 'Quote form heading',
      description:
        "The heading beside the quote form, shown here and on the Get a quote page. The form's own labels, check list and privacy note are under the Quote form tab.",
    },
    'quoteSection.eyebrow': BADGE,
    'quoteSection.line1': { label: 'Title', description: 'White.' },
    'quoteSection.accent': { label: 'Title — red part', description: 'Red, after the white part.' },
    'quoteSection.subtext': SUBTEXT,
  },
  'page.services': {
    hero: { label: 'Top banner', description: 'The dark banner at the top of the Services page.' },
    'hero.eyebrow': BADGE,
    'hero.line1': { label: 'Title — line 1', description: 'White.' },
    'hero.accent': { label: 'Title — line 2', description: 'Red.' },
    'hero.subtext': SUBTEXT,
    'hero.video': { label: 'Background video', description: 'Plays behind the title when switched on below.' },
    'hero.fallbackImage': {
      label: 'Background photo',
      description: 'Shown when the video is off, and while it loads on slow connections.',
    },
    'hero.videoEnabled': { label: 'Play the video instead of the photo' },
    faq: { label: 'FAQ', description: 'Below the list of services. Remove every question to hide the section.' },
    'faq.eyebrow': BADGE,
    'faq.title': { label: 'Title', description: 'White.' },
    'faq.accent': { label: 'Title — red part', description: 'Red, after the white part.' },
    'faq.items': {
      label: 'Questions',
      description: 'Shown in this order; visitors click a question to open its answer.',
    },
    'faq.items.$': { label: 'Question' },
    'faq.items.$.question': { label: 'Question', widget: 'text' },
    'faq.items.$.answer': { label: 'Answer' },
  },
  'page.our-work': {
    hero: { label: 'Top banner', description: 'The dark banner at the top of the Our Work page.' },
    'hero.eyebrow': BADGE,
    'hero.line1': { label: 'Title — line 1', description: 'White.' },
    'hero.accent': { label: 'Title — line 2', description: 'Red.' },
    'hero.subtext': SUBTEXT,
    'hero.video': { label: 'Background video', description: 'Plays behind the title when switched on below.' },
    'hero.fallbackImage': {
      label: 'Background photo',
      description: 'Shown when the video is off, and while it loads on slow connections.',
    },
    'hero.videoEnabled': { label: 'Play the video instead of the photo' },
  },
  'page.insurance': {
    hero: { label: 'Top banner', description: 'The dark banner at the top of the Insurance page.' },
    'hero.eyebrow': BADGE,
    'hero.line1': { label: 'Title — line 1', description: 'White.' },
    'hero.line2': { label: 'Title — line 2', description: 'White.' },
    'hero.line3': { label: 'Title — line 3', description: 'Red.' },
    'hero.subtext': {
      ...SUBTEXT,
      description: 'The partner logos further down are edited under Home page > Partner logos.',
    },
    'hero.video': { label: 'Background video', description: 'Plays behind the title when switched on below.' },
    'hero.fallbackImage': {
      label: 'Background photo',
      description: 'Shown when the video is off, and while it loads on slow connections.',
    },
    'hero.videoEnabled': { label: 'Play the video instead of the photo' },
    coordination: { label: 'Why us cards', description: 'The cards just after the partner logos.' },
    'coordination.title': { label: 'Title' },
    'coordination.subtext': SUBTEXT,
    'coordination.features': {
      label: 'Cards',
      description: 'Up to 6. The first three cards have fixed icons, in this order.',
    },
    'coordination.features.$': { label: 'Card' },
    'coordination.features.$.title': { label: 'Card title' },
    'coordination.features.$.description': { label: 'Card text' },
    steps: { label: 'Claim steps', description: 'The numbered timeline; numbers follow the order below.' },
    'steps.eyebrow': BADGE,
    'steps.title': { label: 'Title' },
    'steps.items': { label: 'Steps' },
    'steps.items.$': { label: 'Step' },
    'steps.items.$.label': { label: 'Step name' },
    'steps.items.$.description': { label: 'Step text' },
    cta: { label: 'Closing call to action', description: 'The red-accented band near the bottom of the page.' },
    'cta.line1': { label: 'Title', description: 'White.' },
    'cta.accent': { label: 'Title — red part', description: 'Red, after the white part.' },
    'cta.subtext': SUBTEXT,
    disclaimer: { label: 'Small print', description: 'The fine print at the very bottom of the page.' },
  },
  'page.about': {
    hero: {
      label: 'Top banner',
      description: 'The title reads as two lines: "line 1 + red word 1." then "line 2 + red word 2."',
    },
    'hero.eyebrow': BADGE,
    'hero.line1': { label: 'Title — line 1', description: 'White.' },
    'hero.accent1': { label: 'Title — line 1, red word', description: 'Red, right after line 1.' },
    'hero.line2': { label: 'Title — line 2', description: 'White.' },
    'hero.accent2': { label: 'Title — line 2, red word', description: 'Red, right after line 2.' },
    'hero.image': {
      label: 'Background photo',
      description: 'Shown when the video is off, and while it loads. Leave empty to use the built-in photo.',
    },
    'hero.video': { label: 'Background video', description: 'Plays behind the title when switched on below.' },
    'hero.videoEnabled': { label: 'Play the video instead of the photo' },
    heritage: { label: 'Our story', description: 'The section right under the banner.' },
    'heritage.title': { label: 'Title' },
    'heritage.text': { label: 'Story' },
    'heritage.stat1': {
      label: 'First number',
      description: 'A big figure with a short caption, e.g. "1998" / "Est.".',
    },
    'heritage.stat1.value': { label: 'Figure' },
    'heritage.stat1.label': { label: 'Caption' },
    'heritage.stat2': { label: 'Second number' },
    'heritage.stat2.value': { label: 'Figure' },
    'heritage.stat2.label': { label: 'Caption' },
    'heritage.image': { label: 'Story photo', description: 'Leave empty to use the built-in photo.' },
    'heritage.quote': { label: 'Quote', description: 'In the card overlapping the bottom of the photo.' },
    team: { label: 'Team' },
    'team.title': { label: 'Title' },
    'team.subtext': SUBTEXT,
    'team.members': { label: 'People' },
    'team.members.$': { label: 'Person' },
    'team.members.$.name': { label: 'Name' },
    'team.members.$.role': { label: 'Job title' },
    'team.members.$.image': { label: 'Photo', description: 'Leave empty to use the built-in photo.' },
    standards: { label: 'Our standards', description: 'The last section of the page.' },
    'standards.eyebrow': BADGE,
    'standards.title': {
      label: 'Title',
      widget: 'textarea',
      description: 'A line break is shown as a space; the last word is red.',
    },
    'standards.image': { label: 'Photo', description: 'Leave empty to use the built-in photo.' },
    'standards.items': { label: 'Standards' },
    'standards.items.$': { label: 'Standard' },
    'standards.items.$.title': { label: 'Title' },
    'standards.items.$.description': { label: 'Text' },
  },
  'page.process': {
    eyebrow: BADGE,
    title: {
      label: 'Title',
      description: 'The last two words are red. "{count}" becomes the number of switched-on steps.',
    },
    subtext: SUBTEXT,
    video: { label: 'Background video', description: 'Plays behind the title when switched on below.' },
    fallbackImage: {
      label: 'Background photo',
      description: 'Shown when the video is off, and while it loads on slow connections.',
    },
    videoEnabled: { label: 'Play the video instead of the photo' },
  },
  'page.contact': {
    hero: {
      label: 'Top banner',
      description: 'The banner at the top of the Contact page. Phone, email and address are under Settings > Contact.',
    },
    'hero.eyebrow': BADGE,
    'hero.line1': { label: 'Title — line 1', description: 'White.' },
    'hero.accent': { label: 'Title — line 2', description: 'Red.' },
    'hero.subtext': SUBTEXT,
    'hero.video': { label: 'Background video', description: 'Plays behind the title when switched on below.' },
    'hero.fallbackImage': {
      label: 'Background photo',
      description: 'Shown when the video is off, and while it loads on slow connections.',
    },
    'hero.videoEnabled': { label: 'Play the video instead of the photo' },
  },
  'page.get-a-quote': {
    hero: {
      label: 'Top banner',
      description: 'The banner at the top of the Get a quote page. It appears only on that page.',
    },
    'hero.eyebrow': BADGE,
    'hero.line1': { label: 'Title — line 1', description: 'White.' },
    'hero.accent': { label: 'Title — line 2', description: 'Red.' },
    'hero.subtext': SUBTEXT,
    'hero.video': { label: 'Background video', description: 'Plays behind the title when switched on below.' },
    'hero.fallbackImage': {
      label: 'Background photo',
      description: 'Shown when the video is off, and while it loads on slow connections.',
    },
    'hero.videoEnabled': { label: 'Play the video instead of the photo' },
  },
  ...MARKETING_FIELD_UI,
  ...SEO_PAGE_FIELD_UI,
};
