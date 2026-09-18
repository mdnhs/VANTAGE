import { db } from './index';
import { contactMessages } from './schema/contact-messages';

const HOUR = 60 * 60 * 1000;
const ago = (hours: number) => new Date(Date.now() - hours * HOUR);

const SEED_CONTACTS: Array<typeof contactMessages.$inferInsert> = [
  {
    firstName: 'Aoife',
    lastName: 'Brennan',
    email: 'aoife.brennan@example.ie',
    phone: '+353 86 123 4501',
    service: 'crash-repair',
    message:
      "Hi, someone reversed into the rear quarter panel of my Golf in a car park yesterday. It's driveable but the panel is creased. Could you tell me roughly how long a repair takes and whether you deal with FBD directly?",
    status: 'new',
    source: 'contact_page',
    createdAt: ago(1),
  },
  {
    firstName: 'Cian',
    lastName: "O'Sullivan",
    email: 'cian.osullivan@example.ie',
    phone: '+353 87 555 0142',
    service: 'paintwork',
    message:
      "Looking to get my 2019 Mini Cooper resprayed from black to British Racing Green. Do you offer a full bare-metal respray and what's the typical turnaround? Happy to drop in for a look if that's easier.",
    status: 'new',
    source: 'contact_page',
    createdAt: ago(6),
  },
  {
    firstName: 'Niamh',
    lastName: 'Gallagher',
    email: 'niamh.gallagher@example.ie',
    phone: '+353 85 908 7723',
    service: 'pdr',
    message:
      'I have three small dents on the bonnet from hail. Would paintless dent repair work for these? I can send photos if that helps.',
    status: 'read',
    source: 'contact_page',
    createdAt: ago(26),
  },
  {
    firstName: 'Darragh',
    lastName: 'Kelly',
    email: 'darragh.kelly@example.ie',
    phone: '+353 89 441 2098',
    service: 'alloy',
    message:
      'Kerbed two alloys on my Audi A4 — bad scuffing on the rims but no cracks. Do you refurbish 18 inch diamond-cut wheels and how much roughly per wheel?',
    status: 'read',
    adminNotes: 'Quoted €90 per wheel by phone. Customer to confirm drop-off date.',
    source: 'contact_page',
    createdAt: ago(48),
  },
  {
    firstName: 'Saoirse',
    lastName: 'Murphy',
    email: 'saoirse.murphy@example.ie',
    phone: '+353 83 220 6614',
    service: 'classic',
    message:
      "I've inherited my dad's 1987 Ford Escort RS Turbo. It needs rust work on the sills and a full repaint. Is classic restoration something you take on? I'd love to come and talk it through.",
    status: 'replied',
    adminNotes: 'Emailed to book a workshop visit for Saturday 10am. Follow up if no reply by Thursday.',
    source: 'contact_page',
    createdAt: ago(72),
  },
  {
    firstName: 'Eoin',
    lastName: 'Fitzgerald',
    email: 'eoin.fitzgerald@example.ie',
    phone: '+353 86 774 3310',
    service: 'scratch-repair',
    message:
      "Someone keyed the driver's side of my Tiguan. Long scratch across two doors. Can this be fixed without repainting the whole panel?",
    status: 'replied',
    adminNotes: 'Advised SMART repair blend on both doors. Booked in for next Tuesday.',
    source: 'footer',
    createdAt: ago(120),
  },
  {
    firstName: 'Grainne',
    lastName: 'Doyle',
    email: 'grainne.doyle@example.ie',
    phone: '+353 87 630 1185',
    service: null,
    message:
      'Just a general question — do you provide a courtesy car while my vehicle is in for repair, and is it covered under my insurance policy?',
    status: 'read',
    source: 'general',
    createdAt: ago(150),
  },
  {
    firstName: 'Fionn',
    lastName: 'Walsh',
    email: 'fionn.walsh@example.ie',
    phone: '+353 89 315 9026',
    service: 'structural',
    message:
      'My BMW 320d was in a front-end collision last month and the car pulls slightly to the left. Insurer wants an independent chassis alignment report. Can you carry out laser measurement and provide a written report?',
    status: 'archived',
    adminNotes: 'Handled by phone — customer went with the insurer approved garage.',
    source: 'contact_page',
    createdAt: ago(400),
  },
];

async function seed() {
  const existing = await db.query.contactMessages.findMany();
  if (existing.length > 0) {
    console.log(`Contact messages table already has ${existing.length} rows, skipping seed.`);
    return;
  }

  console.log('Seeding dummy contact messages...');
  await db.insert(contactMessages).values(SEED_CONTACTS);
  console.log(`Successfully seeded ${SEED_CONTACTS.length} contact messages.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
