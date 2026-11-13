import type { HelpArticle } from '../types';

export const INBOX_DOCS: readonly HelpArticle[] = [
  {
    slug: 'quote-pipeline',
    group: 'inbox',
    title: 'Quote requests and the job pipeline',
    description: 'Follow every quote request from new lead to finished job.',
    lead: '**Quote requests** collects every quote from the website, plus the ones you log by hand, and follows each one through to a finished job.',
    permission: { quote: ['read'] },
    keywords: ['quotes', 'leads', 'pipeline', 'board', 'inbox', 'status', 'jobs'],
    sections: [
      {
        title: 'Two views',
        blocks: [
          {
            type: 'p',
            text: 'Switch between the two views at the top of **Enquiries**, **Quote requests**.',
          },
          { type: 'open', href: '/dashboard/enquiries/quotes', label: 'Open Quote requests' },
        ],
      },
      {
        title: 'Pipeline',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: 'A board with one column per stage: **New**, **Contacted**, **Waiting for Response**, **Quote Sent**, **Approved**, **Work in Progress**, **Completed** and **Cancelled**. Drag a card to the next column, or press **Advance to …** on the card.',
          },
        ],
      },
      {
        title: 'Inbox',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: 'A list with folders for each stage, plus **All Quotes** and **Spam**. **New Leads** shows a red count. Search by customer, reg plate or model.',
          },
        ],
      },
      {
        title: 'Work a lead',
        blocks: [
          {
            type: 'steps',
            items: [
              'Open a **New** lead. Read the damage description and open the **Attached Damage Photos**.',
              'Contact the customer with **WhatsApp**, **Call** or **Email**.',
              'Move the status on, for example to **Contacted** or **Quote Sent**. A lead counts as new until its status changes.',
              'Assign it under **Assigned Staff** and book a **Physical Inspection** if needed.',
              'Add an **Estimated Repair Cost** and private **Internal Workshop Notes**, then press **Save Changes**.',
            ],
          },
        ],
      },
      {
        title: 'Log a phone call or walk-in',
        blocks: [
          {
            type: 'p',
            text: 'Press **New Enquiry**. Choose the **Intake Channel** (Phone Call, WhatsApp, Walk-in Customer and so on), fill in the customer, vehicle and damage, and press **Save & Log Enquiry**.',
          },
        ],
      },
      {
        title: 'Hand over and get paid',
        blocks: [
          {
            type: 'p',
            text: 'At the end of a job, use the handover and payment section of the lead: record the **Paid Amount**, **Payment Method** and **Invoice Number**, then press **Mark Paid in Full** and **Mark Handed Over**. Handing over moves the job to **Completed**.',
          },
          {
            type: 'callout',
            tone: 'note',
            text: 'Quotes with invoice or payment records are kept for the accounting rules, even after the normal clean-up period.',
          },
        ],
      },
      {
        title: 'Spam',
        blocks: [
          {
            type: 'p',
            text: 'Suspicious submissions land in **Spam** with the reason. Press **Not spam** to move a real one back to New, or **Mark as spam** on one that slipped through.',
          },
        ],
      },
    ],
  },
  {
    slug: 'contact-messages',
    group: 'inbox',
    title: 'Contact messages',
    description: 'Read and answer messages sent from the Contact page.',
    lead: '**Contact messages** holds general questions sent through the Contact page.',
    permission: { contact: ['read'] },
    keywords: ['messages', 'contact form', 'reply', 'status'],
    sections: [
      {
        title: 'Answer a message',
        blocks: [
          {
            type: 'steps',
            items: [
              'Open **Enquiries**, then **Contact messages**, and pick a message in **New**.',
              'Reply with **WhatsApp**, **Call** or **Email**.',
              'Set the **Status** to **Read**, **Replied** or **Archived**, add private **Notes** if useful, and press **Save Changes**.',
            ],
          },
          { type: 'open', href: '/dashboard/enquiries/contacts', label: 'Open Contact messages' },
          {
            type: 'callout',
            tone: 'note',
            text: 'Opening a message does not mark it read. Change the status yourself so the team knows it is handled.',
          },
        ],
      },
      {
        title: 'Find a message',
        blocks: [
          {
            type: 'p',
            text: 'Use the folders (**All Messages**, **New**, **Read**, **Replied**, **Archived**, **Spam**) or search by name, email or phone.',
          },
        ],
      },
    ],
  },
  {
    slug: 'privacy-requests',
    group: 'inbox',
    title: 'Export, download or erase a customer’s data',
    description: 'Export enquiries to a spreadsheet and handle data requests from a customer.',
    lead: 'Owners and admins can export enquiries and answer a customer’s request to see or erase their data.',
    permission: { quote: ['export'] },
    keywords: ['gdpr', 'export', 'csv', 'erase', 'delete', 'privacy', 'data request'],
    sections: [
      {
        title: 'Export to a spreadsheet',
        blocks: [
          {
            type: 'p',
            text: 'In **Quote requests** or **Contact messages**, open the folder you want and press **Export CSV**. It exports what the folder shows, up to 10,000 rows.',
          },
        ],
      },
      {
        title: 'A customer’s data request',
        blocks: [
          {
            type: 'steps',
            items: [
              'Press **Privacy request** in either inbox.',
              'Enter the customer’s **Email address**.',
              'Press **Download data** to get everything held for that address.',
              'To erase it, type the email again in the second box and press **Erase data**.',
            ],
          },
          {
            type: 'callout',
            tone: 'warning',
            text: 'Erasing cannot be undone. It also removes that person’s live chats. Quotes with invoice or payment records are kept to meet accounting rules.',
          },
        ],
      },
      {
        title: 'Automatic clean-up',
        blocks: [
          {
            type: 'p',
            text: 'Finished enquiries are deleted automatically after the period set in [Data retention](/dashboard/help/data-retention). New and in-progress ones are never deleted.',
          },
        ],
      },
    ],
  },
  {
    slug: 'live-chat',
    group: 'inbox',
    title: 'Answer live chats',
    description: 'Reply to visitors in the chat box, or let the AI assistant handle it.',
    lead: '**Live chat** lists the chats visitors start on the website. When the AI assistant is on, it answers first; a person can take over at any time.',
    permission: { support: ['read'] },
    keywords: ['chat', 'support', 'visitor', 'ai', 'take over', 'hand back', 'assign'],
    sections: [
      {
        title: 'Reply to a chat',
        blocks: [
          {
            type: 'steps',
            items: [
              'Open **Live chat** and pick a chat in **Open**. Bold names are unread.',
              'Press **Take over**, or just reply: replying to an unassigned chat assigns it to you and stops the AI.',
              'Write in **Write a reply** and press Enter to send.',
              'When you are done, press **Hand back to AI** or **End chat**, then **Confirm end**.',
            ],
          },
          { type: 'open', href: '/dashboard/support', label: 'Open Live chat' },
        ],
      },
      {
        title: 'Chats that need a person',
        blocks: [
          {
            type: 'p',
            text: 'A red **Needs a person** badge means the AI could not help, reached its reply limit, or the visitor asked for a person, a quote or a booking. Pick these up first.',
          },
        ],
      },
      {
        title: 'Assigning chats',
        level: 3,
        blocks: [
          {
            type: 'p',
            text: 'Owners and admins use **Assign this chat** to give a chat to someone; people online are marked "(online)". The Support role only sees chats assigned to them.',
          },
        ],
      },
      {
        title: 'How you are told',
        blocks: [
          {
            type: 'list',
            items: [
              'A **New chat message** pop-up on any admin page, with an **Open** button.',
              'The number beside **Live chat** counts unread open chats.',
              'Emails when a visitor needs a person, waits five minutes without a reply, or a chat is assigned to you. They go to the addresses in [Email notifications](/dashboard/help/email-notifications).',
            ],
          },
        ],
      },
      {
        title: 'Delete a chat',
        blocks: [
          {
            type: 'p',
            text: 'Owners and admins can press **Delete**, then **Delete for good**. Chats are otherwise kept for the period in [Data retention](/dashboard/help/data-retention).',
          },
        ],
      },
    ],
  },
  {
    slug: 'chat-widget',
    group: 'inbox',
    title: 'What visitors see in the chat',
    description: 'How the chat box on the website behaves, online and offline.',
    lead: 'Every public page has a chat button in the corner. This is what visitors see when they use it.',
    keywords: ['widget', 'chat box', 'visitor', 'offline', 'quick replies'],
    sections: [
      {
        title: 'Starting a chat',
        blocks: [
          {
            type: 'list',
            items: [
              'A green dot on the button means someone from the team is online.',
              'The bubble offers quick options such as **Get a repair estimate**, **Opening hours & location** and **Book a visit to the workshop**.',
              'Phone numbers, WhatsApp numbers and email addresses in replies are tappable.',
            ],
          },
        ],
      },
      {
        title: 'Who answers',
        blocks: [
          {
            type: 'list',
            items: [
              'With the AI assistant on, it answers first and tells the visitor a team member can join.',
              'Once a person takes over, the visitor sees their first name only.',
              'If nobody is online and the AI is off, the visitor is asked for an email address so you can reply there.',
            ],
          },
          {
            type: 'callout',
            tone: 'note',
            text: 'Visitors are told chats are kept for a set number of months, with a link to the privacy policy.',
          },
        ],
      },
    ],
  },
  {
    slug: 'notifications',
    group: 'inbox',
    title: 'The notifications bell',
    description: 'What the bell at the top of the admin tells you.',
    lead: 'The bell at the top right shows new enquiries and anything that failed to send.',
    keywords: ['bell', 'alerts', 'notifications'],
    sections: [
      {
        title: 'What shows up',
        blocks: [
          {
            type: 'list',
            items: [
              '**New quote request** and **New contact message**, if you can read them. Spam is left out.',
              '**An enquiry email didn’t send**: check the mail settings with an owner.',
              '**Meta Conversions API failed**, for people with tracking access.',
            ],
          },
          {
            type: 'p',
            text: 'The red number counts unread items and clears when you open the bell. It keeps the last 30 days.',
          },
        ],
      },
    ],
  },
];
