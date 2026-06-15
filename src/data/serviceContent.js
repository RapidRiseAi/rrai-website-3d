// ── Service detail page content ──────────────────────────────────────────────
//
// Every /services/:slug page renders from this map through
// src/pages/ServiceDetailPage.jsx. Edit content here, no JSX changes needed.
//
// Shape per slug:
//   positioning   one line hero positioning statement
//   problem       paragraphs describing what the client struggles with
//   solution      list of what Rapid Rise AI builds (rendered as cards)
//   packages      fixed price packages (name, price, monthly, badge, features, limits)
//   packageGroups extra named package groups (e.g. eCommerce)
//   customPricing custom-rate pricing block (custom services only)
//   addons        priced add ons (label + price)
//   deliverables  what the client receives
//   faqs          frequently asked questions
//   notes         usage / exclusion notes shown near pricing

export const PRICING_DISCLAIMER =
  'All prices are starting points in ZAR. Final pricing depends on customization, integrations, content, data complexity, usage, third party tools, support needs, and the approved project scope. Custom development and consulting are quoted at R500/hour unless a fixed project price is agreed.'

export const CUSTOM_RATE = 'R500/hour'

/* Shared delivery process, shown on every service page */
export const SERVICE_PROCESS = [
  { step: 'Discovery', desc: 'We learn how your business runs, what slows it down, and what you want to achieve.' },
  { step: 'Scope & Proposal', desc: 'You receive a clear written proposal with deliverables, timeline, and pricing.' },
  { step: 'Build & Integration', desc: 'We design and build the system, connecting it to the tools you already use.' },
  { step: 'Testing & Refinement', desc: 'Everything is tested on real devices and refined until it works the way it should.' },
  { step: 'Launch & Support', desc: 'We launch, hand over, and stay available through monthly support and future phases.' },
]

const THIRD_PARTY_NOTE =
  'Third party software fees, AI usage, WhatsApp and API usage, SMS, payment provider fees, paid ads spend, hardware, hosting upgrades, and premium plugin costs are separate unless included in a written proposal.'

export const SERVICE_CONTENT = {
  /* ── 1. Website Development ──────────────────────────────────────────────── */
  'website-development': {
    positioning:
      'Websites built to earn trust, capture leads, rank better, and connect into the rest of your business ecosystem.',
    problem: [
      'Most business websites look fine but do very little. They load slowly, say too little about the business, capture no leads, and never connect to the systems the business actually runs on.',
      'A website should be the front door of your business: easy to find, easy to trust, and built to turn attention into enquiries.',
    ],
    solution: [
      'Premium business websites',
      'Landing pages and conversion flows',
      'Technical SEO and on page structure',
      'Quote, booking, and enquiry systems',
      'Lead capture connected to email or sheets',
      'Upgrade paths into portals, dashboards, and AI agents',
    ],
    packages: [
      {
        name: 'Basic Website',
        price: 'R2,000 setup',
        monthly: 'R200/month',
        summary: 'A clean professional starting point for a business that needs to be online.',
        features: [
          'Up to 3 static pages',
          'Mobile responsive design',
          'Contact form',
          'WhatsApp click button',
          'Google Maps embed',
          'Social links',
          'SSL setup and domain connection',
          'Basic speed optimisation',
          'Basic on page SEO',
          'Go live support',
          '1 revision round',
        ],
      },
      {
        name: 'Business Website',
        price: 'From R4,500 setup',
        monthly: 'R350/month',
        summary: 'A stronger presence with service sections, lead capture, and tracking.',
        features: [
          'Everything in Basic',
          'Up to 5 pages',
          'Improved layout',
          'Service and product sections',
          'Testimonials, gallery, or portfolio section',
          'Lead capture form',
          'Google Analytics and Meta Pixel setup',
          'Basic schema markup',
          '2 revision rounds',
        ],
      },
      {
        name: 'Growth Website',
        price: 'From R7,500 setup',
        monthly: 'R650/month',
        badge: 'Recommended',
        summary: 'Built for businesses that want the website to actively generate enquiries.',
        features: [
          'Everything in Business',
          'Up to 8 pages',
          'Landing page structure',
          'Service specific pages',
          'FAQ section',
          'Blog or news setup',
          'Basic AI search optimisation structure',
          'Basic automation such as enquiry to email or Google Sheets',
          '3 revision rounds',
        ],
      },
      {
        name: 'Premium Website',
        price: 'From R12,500 setup',
        monthly: 'R950/month',
        summary: 'Premium design, conversion structure, and tracking for serious lead generation.',
        features: [
          'Everything in Growth',
          'Up to 12 pages',
          'Premium visual design',
          'Stronger brand positioning',
          'Advanced sales copy structure',
          'Multiple landing pages',
          'Advanced animations or micro interactions',
          'Case study section',
          'Lead funnel structure',
          'Conversion tracking',
          'Detailed schema setup',
          'Newsletter signup',
          'Up to 2 simple automations',
        ],
      },
      {
        name: 'Bespoke Website',
        price: 'From R20,000 setup',
        monthly: 'From R1,500/month',
        summary: 'Fully custom design and functionality, scoped around your exact goals.',
        features: [
          'Fully custom design',
          '3D, interactive, or animated sections where required',
          'Custom forms, calculators, and logic',
          'Advanced SEO structure',
          'Optional AI, portal, dashboard, or eCommerce functionality',
          'Advanced integrations',
          'Custom timeline and scope',
        ],
      },
    ],
    packageGroups: [
      {
        title: 'eCommerce Packages',
        intro: 'Online stores from first products to large connected catalogues.',
        packages: [
          {
            name: 'eCom Starter',
            price: 'R5,000 setup',
            monthly: 'R400/month',
            features: [
              'Up to 10 products',
              'Product templates',
              'Cart and checkout',
              'Payment gateway setup',
              'Basic shipping and order email setup',
              'Mobile checkout optimisation',
              'Basic inventory tracking',
            ],
          },
          {
            name: 'eCom Growth',
            price: 'From R12,500 setup',
            monthly: 'R950/month',
            features: [
              'Up to 50 products',
              'Customer accounts and order history',
              'Reviews and coupons',
              'Abandoned cart setup',
              'Analytics and pixel setup',
              'Detailed shipping rules',
              'Basic sales dashboard',
            ],
          },
          {
            name: 'eCom Business',
            price: 'From R25,000 setup',
            monthly: 'R2,000/month',
            features: [
              'Up to 150 products',
              'Advanced categories and filters',
              'Stock alerts',
              'Multiple shipping zones',
              'Email marketing integration',
              'CRM or Google Sheets integration',
              'Monthly sales report',
              'Basic automation flows',
            ],
          },
          {
            name: 'Custom eCommerce',
            price: 'From R50,000 setup',
            monthly: 'From R4,000/month',
            features: [
              'Large catalogues',
              'Subscriptions',
              'Marketplace or vendor accounts',
              'Custom checkout',
              'ERP or accounting integration',
              'Advanced inventory',
              'AI shopping assistant and recommendations',
              'Custom dashboards',
            ],
          },
        ],
      },
    ],
    addons: [
      { label: 'Google Business Profile setup', price: 'R750' },
      { label: 'Google Business Profile optimisation', price: 'R1,500' },
      { label: 'Basic SEO', price: 'R300/month' },
      { label: 'Local SEO', price: 'R750/month' },
      { label: 'Growth SEO', price: 'R1,500/month' },
      { label: 'Advanced SEO', price: 'From R3,000/month' },
      { label: 'Extra page', price: 'R750 to R1,500/page' },
      { label: 'Extra landing page', price: 'R1,500 to R4,500' },
      { label: 'Content writing (basic)', price: 'R300/page' },
      { label: 'SEO copywriting', price: 'R750 to R1,500/page' },
      { label: 'Contact form automation', price: 'R750 to R2,500' },
      { label: 'Custom calculator', price: 'R3,500 to R15,000' },
      { label: 'AI chatbot starter', price: 'R1,000 setup + R200/month' },
    ],
    deliverables: [
      'A live, mobile responsive website on your domain',
      'SSL, hosting, and maintenance under your monthly plan',
      'Lead capture wired to your inbox or sheets',
      'Analytics and tracking where included',
      'Go live support and a clear upgrade path',
    ],
    faqs: [
      {
        q: 'How long does a website take?',
        a: 'Most websites go live within 1 to 2 weeks, depending on the required customization and package. Starter packages are usually done in under a week. Larger or more bespoke builds are confirmed in your proposal.',
      },
      {
        q: 'What does the monthly fee cover?',
        a: 'Hosting, SSL, backups, software updates, and basic maintenance for your plan. Larger plans include more support time and ongoing improvements.',
      },
      {
        q: 'Can my website grow into something bigger later?',
        a: 'Yes. Every website we build is structured so portals, dashboards, AI agents, automations, and eCommerce can be added later without starting over.',
      },
      {
        q: 'Why do prices say "from"?',
        a: 'Final pricing depends on content, integrations, and the approved scope. You always receive a written quote before work starts.',
      },
    ],
  },

  /* ── 2. Client Portals ───────────────────────────────────────────────────── */
  'client-portal': {
    positioning:
      'Client portals that reduce back and forth communication, organize documents, show updates, send reminders, and give you better admin visibility.',
    problem: [
      'Client admin lives in email threads, WhatsApp chats, and shared folders. Documents go missing, statuses are unclear, and your team answers the same questions every day.',
      'A portal gives every client one private place to upload, track, and communicate, and gives your team one organized view of everything.',
    ],
    solution: [
      'Branded client login portals',
      'Document upload and collection areas',
      'Status updates and progress tracking',
      'Client onboarding forms',
      'Automated reminders and alerts',
      'Admin dashboards for your team',
    ],
    packages: [
      {
        name: 'Starter',
        price: 'From R3,000 setup',
        monthly: 'R500/month',
        summary: 'A simple branded portal that gets client documents out of your inbox.',
        features: [
          'Simple branded portal from template',
          'Client login and private access',
          'Basic client dashboard',
          'Document upload area',
          'Files and reports section',
          'Basic client information form',
          'Basic admin view',
          'Hosting, backups, and maintenance',
        ],
        limits: ['10 client accounts', '1 admin user', '2GB storage', '30 minutes support/month', '1 build revision', 'No integrations included'],
      },
      {
        name: 'Essential',
        price: 'From R7,500 setup',
        monthly: 'R850/month',
        summary: 'A stronger portal with statuses, requests, and your first integration.',
        features: [
          'Everything in Starter',
          'Improved branded dashboard',
          'Document status: received or missing',
          'Basic status update area',
          'Client request and contact form',
          'Up to 5 custom portal sections',
          '1 basic integration such as email or Google Sheets',
        ],
        limits: ['25 client accounts', '2 admin users', '5GB storage', '1 hour support/month', '2 build revisions'],
      },
      {
        name: 'Growth',
        price: 'From R14,500 setup',
        monthly: 'R1,500/month',
        badge: 'Recommended',
        summary: 'Onboarding, reminders, and tracking that remove real admin hours.',
        features: [
          'Everything in Essential',
          'Client onboarding forms',
          'Automated reminder flow',
          'Progress tracking',
          'Organized reports',
          'Basic analytics dashboard',
          'Email alerts',
          'Better admin tracking view',
        ],
        limits: ['50 client accounts', '3 admin users', '10GB storage', '2 hours support/month', 'Up to 2 integrations'],
      },
      {
        name: 'Business',
        price: 'From R24,500 setup',
        monthly: 'R2,500/month',
        summary: 'Custom workflows, roles, and reporting for busy operations.',
        features: [
          'Everything in Growth',
          'Custom workflow structure',
          'Activity tracking',
          'Internal business dashboard',
          'Two automation or reminder flows',
          'Light role based access',
          'Advanced reports',
          'Priority support queue',
          'Monthly improvement allowance',
        ],
        limits: ['100 client accounts', '5 admin users', '25GB storage', '4 hours support/month', 'Up to 3 integrations'],
      },
      {
        name: 'Custom System',
        price: 'From R45,000 setup',
        monthly: 'From R4,500/month',
        summary: 'A fully custom portal platform shaped around your operation.',
        features: [
          'Custom roles',
          'Departments and branches',
          'Advanced dashboards',
          'Advanced automations',
          'AI assistant options',
          'Complex integrations',
          'Custom reporting and data flows',
        ],
      },
    ],
    addons: [
      { label: 'Extra 25 client accounts', price: 'R150/month' },
      { label: 'Extra admin user', price: 'R100/month' },
      { label: 'Extra 10GB storage', price: 'R150/month' },
      { label: 'Extra portal section', price: 'R750 to R2,500' },
      { label: 'Simple integration', price: 'R1,500 to R3,500 setup + R100/month' },
      { label: 'Standard integration', price: 'R3,500 to R7,500 setup + R250/month' },
      { label: 'Advanced API integration', price: 'From R8,500 setup + from R500/month' },
      { label: 'Automated reminder flow', price: 'R2,500 to R6,500 setup + R250 to R750/month' },
      { label: 'Analytics dashboard', price: 'R3,500 to R12,500 setup + R350 to R1,000/month' },
      { label: 'Payment gateway setup', price: 'R3,500 to R8,500 setup + R250/month' },
      { label: 'WhatsApp notifications', price: 'From R3,500 setup + R500/month' },
      { label: 'WhatsApp AI Lite', price: 'From R6,500 setup + R1,000/month' },
      { label: 'WhatsApp AI Standard', price: 'From R12,500 setup + R2,000/month' },
      { label: 'WhatsApp AI Pro', price: 'From R25,000 setup + from R4,500/month' },
    ],
    deliverables: [
      'A live branded portal with private client logins',
      'Admin access for your team',
      'Hosting, backups, and maintenance under your plan',
      'Training and handover documentation',
      'A clear upgrade path as your client base grows',
    ],
    faqs: [
      {
        q: 'How do clients access the portal?',
        a: 'Each client receives a private login. The portal runs in the browser on any device, so there is nothing to install.',
      },
      {
        q: 'Can the portal connect to my existing tools?',
        a: 'Yes. Integrations with email, Google Sheets, CRMs, and other tools are available from the Essential plan upward or as add ons.',
      },
      {
        q: 'What happens when I outgrow my plan limits?',
        a: 'You can add capacity through add ons or move up a plan. Nothing needs to be rebuilt.',
      },
      {
        q: 'Why do prices say "from"?',
        a: 'Portals vary by sections, integrations, and data complexity. You always receive a written quote before work starts.',
      },
    ],
  },

  /* ── 3. Smart Dashboards ─────────────────────────────────────────────────── */
  'smart-dashboards': {
    positioning:
      'Custom dashboards that bring sales, client, operations, finance, staff, and performance data into one clear view.',
    problem: [
      'Business data is scattered across spreadsheets, tools, and people. Getting a simple answer means chasing reports, and decisions get made on feel instead of fact.',
      'A dashboard turns scattered activity into one live view your team can actually use.',
    ],
    solution: [
      'Sales and revenue dashboards',
      'Operations and team dashboards',
      'KPI cards and trend charts',
      'Automated data sync from your tools',
      'Alerts and scheduled reports',
      'Management and executive views',
    ],
    packages: [
      {
        name: 'Dashboard Starter',
        price: 'R3,000 setup',
        monthly: 'R400/month',
        summary: 'One clear page for the numbers that matter most.',
        features: [
          '1 dashboard page',
          'Up to 5 key metrics',
          'Basic charts and tables',
          'Manual or Google Sheets data source',
          'Basic filtering',
          '1 user',
          'Basic hosting and maintenance',
          '30 minutes support/month',
          '1 revision before launch',
        ],
      },
      {
        name: 'Dashboard Essential',
        price: 'From R6,500 setup',
        monthly: 'R650/month',
        summary: 'More metrics, better layout, and your first automated sync.',
        features: [
          'Everything in Starter',
          'Up to 2 pages',
          'Up to 10 key metrics',
          'Better visual layout',
          'Date and category filters',
          '1 automated data sync',
          'Up to 2 users',
          '1 hour support/month',
          '2 revision rounds',
        ],
      },
      {
        name: 'Dashboard Growth',
        price: 'From R12,500 setup',
        monthly: 'R1,200/month',
        badge: 'Recommended',
        summary: 'A real reporting layer: multiple pages, integrations, and alerts.',
        features: [
          'Everything in Essential',
          'Up to 4 pages',
          'Up to 25 metrics',
          'Up to 3 integrations',
          'Automated data refresh',
          'KPI cards and trend charts',
          'Progress tracking',
          'Basic alerts',
          'Up to 5 users',
          '2 hours support/month',
        ],
      },
      {
        name: 'Dashboard Business',
        price: 'From R22,500 setup',
        monthly: 'R2,200/month',
        summary: 'Advanced analytics and role based views for management and teams.',
        features: [
          'Everything in Growth',
          'Up to 8 pages',
          'Up to 50 metrics',
          'Up to 5 integrations',
          'Advanced filtering',
          'Advanced analytics',
          'Management dashboard',
          'Internal team dashboard',
          'Exportable reports',
          'Basic role based access',
          'Up to 10 users',
          '4 hours support/month',
          'Priority support',
        ],
      },
      {
        name: 'Custom BI System',
        price: 'From R40,000 setup',
        monthly: 'From R4,000/month',
        summary: 'A full business intelligence layer across branches and departments.',
        features: [
          'Multiple data sources',
          'Branches and departments',
          'Custom APIs',
          'Advanced permissions',
          'Automated reports',
          'Forecasting',
          'AI insights',
          'Executive reporting',
        ],
      },
    ],
    addons: [
      { label: 'Extra dashboard page', price: 'R1,500 to R3,500 setup + R100 to R300/month' },
      { label: 'Extra 5 metrics', price: 'R750 to R2,000 setup + R50 to R150/month' },
      { label: 'Extra user', price: 'R250 setup + R50 to R150/user/month' },
      { label: 'Extra simple integration', price: 'R2,500 to R8,500 setup + R250 to R1,000/month' },
      { label: 'Advanced integration or API', price: 'R8,500 to R25,000 setup + R1,000 to R3,500/month' },
      { label: 'Automated PDF report', price: 'R3,500 to R9,500 setup + R300 to R1,200/month' },
      { label: 'Email report automation', price: 'R2,500 to R6,500 setup + R250 to R750/month' },
      { label: 'WhatsApp report alerts', price: 'R4,500 to R12,500 setup + R750 to R2,500/month' },
      { label: 'AI insights summary', price: 'R5,500 to R15,000 setup + R1,000 to R3,500/month' },
      { label: 'Forecasting module', price: 'R8,500 to R25,000 setup + R1,500 to R5,000/month' },
      { label: 'Data cleanup or migration', price: 'R500/hour unless quoted as a fixed project' },
    ],
    deliverables: [
      'A live dashboard your team can open on any device',
      'Connected data sources with automated refresh where included',
      'User access for your team',
      'Hosting and maintenance under your plan',
      'Training and handover documentation',
    ],
    faqs: [
      {
        q: 'Where does the dashboard data come from?',
        a: 'From the tools you already use: spreadsheets, forms, CRMs, accounting tools, and other systems, depending on your plan and integrations.',
      },
      {
        q: 'How current is the data?',
        a: 'Starter plans can use manual or sheet based updates. From Essential upward, automated syncs keep the dashboard refreshed on a schedule.',
      },
      {
        q: 'Can different staff see different views?',
        a: 'Yes. Role based access is included in the Business plan and available in custom builds.',
      },
      {
        q: 'Why do prices say "from"?',
        a: 'Dashboards vary by data sources, metric complexity, and integrations. You always receive a written quote before work starts.',
      },
    ],
  },

  /* ── 4. AI Communication Agents ──────────────────────────────────────────── */
  'ai-communication-agent': {
    positioning:
      'AI communication agents for website chat, WhatsApp, social inboxes, support requests, bookings, availability checks, customer routing, staff alerts, and connected business actions.',
    problem: [
      'Customers ask the same questions all day, after hours, and on every channel. Slow replies lose leads, and your team loses hours answering things an agent could handle.',
      'An AI agent answers instantly, captures the lead, routes the conversation, and hands over to a human when it matters.',
    ],
    solution: [
      'Website chat agents',
      'WhatsApp support agents',
      'Booking and availability flows',
      'Lead capture and qualification',
      'Staff alerts and routing',
      'CRM and sheet logging',
    ],
    packages: [
      {
        name: 'AI Agent Starter',
        price: 'R1,000 setup',
        monthly: 'R200/month',
        summary: 'A website support agent that answers your most common questions.',
        features: [
          '1 website AI support agent',
          'Website chat widget only',
          'Up to 25 FAQs and business answers',
          'Basic business info setup',
          'Basic lead capture',
          'Basic human handover message',
          'Basic testing and maintenance',
        ],
        limits: ['Up to 250 AI replies/month', '15 minutes support/month'],
      },
      {
        name: 'AI Agent Essential',
        price: 'From R3,500 setup',
        monthly: 'R500/month',
        summary: 'Better conversations, lead routing, and your first integration.',
        features: [
          'Everything in Starter',
          'Up to 75 FAQs and business answers',
          'Better conversation structure',
          'Lead capture to email or Google Sheets',
          'Service and product guidance',
          'Enquiry routing',
          'Appointment request flow',
          '1 simple integration',
        ],
        limits: ['Up to 500 AI replies/month', '30 minutes support/month'],
      },
      {
        name: 'AI Agent Growth',
        price: 'From R7,500 setup',
        monthly: 'R1,200/month',
        badge: 'Recommended',
        summary: 'Two channels, bookings, intake forms, and staff notifications.',
        features: [
          'Everything in Essential',
          'Up to 2 channels',
          'Up to 150 FAQs and business answers',
          'Basic availability checking',
          'Booking request workflow',
          'Customer intake forms',
          'Automated staff notifications',
          'Up to 3 integrations',
          'CRM or Google Sheets logging',
          'Conversation tags and categories',
          'Basic analytics',
        ],
        limits: ['Up to 1,000 AI replies/month', '1 hour support/month'],
      },
      {
        name: 'AI Agent Business',
        price: 'From R15,000 setup',
        monthly: 'R2,500/month',
        summary: 'Advanced booking logic, escalations, follow ups, and a dashboard.',
        features: [
          'Everything in Growth',
          'Up to 3 channels',
          'Up to 300 FAQs and business answers',
          'Advanced booking and availability logic',
          'Customer status checks',
          'Internal staff alerts',
          'Follow up messages',
          'Escalation rules',
          'Human handover workflow',
          'Basic internal dashboard',
          'Up to 5 integrations',
          'Advanced lead qualification',
        ],
        limits: ['Up to 2,500 AI replies/month', '2 hours support/month'],
      },
      {
        name: 'AI Agent Pro',
        price: 'From R30,000 setup',
        monthly: 'From R5,500/month',
        summary: 'Omnichannel support with CRM updates, payments, and reminders.',
        features: [
          'Everything in Business',
          'Omnichannel setup',
          'Advanced workflows',
          'CRM updates',
          'Payment link generation',
          'Quote request automation',
          'Appointment confirmations',
          'Reminder flows',
          'Multi language setup',
          'Advanced AI knowledge base',
          'Deeper analytics',
          'Priority support',
          'Up to 7 integrations',
        ],
        limits: ['Up to 5,000 AI replies/month', '4 hours support/month'],
      },
      {
        name: 'Custom AI Communication System',
        price: 'From R60,000 setup',
        monthly: 'From R10,000/month',
        summary: 'High volume, multi branch AI communication built to spec.',
        features: [
          'High volume WhatsApp support',
          'Multiple branches and departments',
          'Advanced CRM integrations',
          'Booking engines and payment systems',
          'Portals and dashboards',
          'Internal staff workflows',
          'Custom APIs',
          'Voice AI options',
          'Advanced reporting',
          'SLA support',
        ],
      },
    ],
    notes: [
      'Extra usage can be billed separately once included reply limits are exceeded.',
      'AI, WhatsApp and API, SMS, social inbox tools, and third party platform fees are excluded unless included in writing.',
      'AI agents include human handover for sensitive or complex situations.',
      'AI agents do not provide legal, medical, or financial advice.',
    ],
    deliverables: [
      'A live AI agent on your chosen channels',
      'A knowledge base built from your business information',
      'Lead capture and logging wired to your tools',
      'Human handover and escalation rules',
      'Monthly maintenance and reply allowance per plan',
    ],
    faqs: [
      {
        q: 'What happens when the AI cannot answer?',
        a: 'The agent hands the conversation to a human. Handover rules and staff alerts are part of every setup.',
      },
      {
        q: 'What counts as an AI reply?',
        a: 'Each AI generated response in a conversation counts toward your monthly allowance. Extra usage can be billed separately once limits are exceeded.',
      },
      {
        q: 'Which channels are supported?',
        a: 'Website chat from Starter, with WhatsApp and social inboxes available from Growth upward depending on the plan.',
      },
      {
        q: 'Does the agent learn my business?',
        a: 'Yes. We build its knowledge base from your FAQs, services, policies, and tone, then test and refine it before launch.',
      },
    ],
  },

  /* ── 5. Software Development ─────────────────────────────────────────────── */
  'software-development': {
    positioning: 'Custom software built around real business processes, not generic templates.',
    problem: [
      'Off the shelf tools force your business to work their way. The result is workarounds, spreadsheets on the side, and processes nobody can see end to end.',
      'Custom software fits the way your business actually runs, and connects to everything else you use.',
    ],
    solution: [
      'Internal tools',
      'Admin systems',
      'Operations systems',
      'Data management tools',
      'Approval workflows',
      'Reporting tools',
      'Staff portals',
      'Custom calculators',
      'Document systems',
      'Connected software that integrates with dashboards, AI agents, portals, websites, and automations',
    ],
    customPricing: {
      lines: [
        'Custom quoted after discovery.',
        `Standard custom rate: ${CUSTOM_RATE}.`,
        'Fixed project pricing can be agreed once scope is clear.',
      ],
      exclusions:
        'Third party tools, hosting, databases, AI usage, API fees, licensing, and support retainers are separate unless included in the written proposal.',
    },
    deliverables: [
      'Software built to your approved scope',
      'Documentation and handover',
      'Integration with your existing tools where scoped',
      'A support and improvement plan',
    ],
    faqs: [
      {
        q: 'How is custom software priced?',
        a: 'After a discovery conversation we quote either a fixed project price or work at the standard custom rate of R500/hour. You always approve the scope in writing first.',
      },
      {
        q: 'Do I own the software?',
        a: 'Client specific deliverables and usage rights are defined in the agreement. Reusable frameworks and internal tooling remain with Rapid Rise AI unless agreed otherwise.',
      },
      {
        q: 'Can it start small?',
        a: 'Yes. Most systems start with one painful process and grow from there. That keeps cost low and value visible early.',
      },
    ],
  },

  /* ── 6. Web App Development ──────────────────────────────────────────────── */
  'web-app-development': {
    positioning:
      'Interactive web apps and online platforms that users access from the browser, with no app store required.',
    problem: [
      'You need a real product: logins, dashboards, workflows, payments. A website is too little and a native mobile app is too much, too early.',
      'A web app gives users full functionality in the browser on any device, and can grow into mobile apps later.',
    ],
    solution: [
      'SaaS style platforms',
      'Booking platforms',
      'Member and client dashboards',
      'Form driven apps',
      'Admin portals',
      'Customer facing tools',
      'Internal workflow apps',
      'Progressive upgrade paths into mobile apps, portals, dashboards, AI, and integrations',
    ],
    customPricing: {
      lines: ['Custom quoted after discovery.', `Standard custom rate: ${CUSTOM_RATE}.`],
      exclusions: THIRD_PARTY_NOTE,
    },
    deliverables: [
      'A working web app on your domain',
      'User accounts and roles where scoped',
      'Admin tooling for your team',
      'Documentation, training, and a growth roadmap',
    ],
    faqs: [
      {
        q: 'Web app or mobile app?',
        a: 'Web apps work on every device immediately and cost less to build and maintain. If you need app store presence later, the web app becomes the foundation.',
      },
      {
        q: 'How long does a web app take?',
        a: 'A focused first version typically takes 4 to 10 weeks depending on scope. The timeline is confirmed in your proposal.',
      },
      {
        q: 'How is it priced?',
        a: 'Custom quoted after discovery, at R500/hour or as an agreed fixed project price.',
      },
    ],
  },

  /* ── 7. Automated Workflows ──────────────────────────────────────────────── */
  'automated-workflow': {
    positioning:
      'Automated workflows that remove repeated manual tasks, connect tools, route information, send reminders, and keep business processes moving.',
    problem: [
      'Someone copies form entries into a sheet. Someone chases documents. Someone forgets the follow up. Manual handoffs slow everything down and leak leads.',
      'Automation connects your tools so information moves itself, reliably, every time.',
    ],
    solution: [
      'Form to email or spreadsheet flows',
      'Lead routing',
      'Client onboarding',
      'Reminder flows',
      'Document follow ups',
      'Staff notifications',
      'CRM updates',
      'Dashboard updates',
      'Payment and booking triggers',
      'AI assisted summaries and routing',
      'Make.com, Zapier, n8n, Google Workspace, CRM, calendar, email, and API automations',
    ],
    customPricing: {
      lines: [
        'Custom quoted after discovery.',
        `Standard custom rate: ${CUSTOM_RATE}.`,
        'Simple automations may be quoted as fixed projects once scope is clear.',
      ],
      exclusions: THIRD_PARTY_NOTE,
    },
    deliverables: [
      'Working automations across your connected tools',
      'Clear documentation of every flow',
      'Error alerts and monitoring where scoped',
      'A support plan for changes and additions',
    ],
    faqs: [
      {
        q: 'Which tools can be connected?',
        a: 'Most modern tools: Google Workspace, CRMs, forms, email, WhatsApp, calendars, payment providers, and anything with an API, via Make.com, Zapier, n8n, or direct integration.',
      },
      {
        q: 'What does a small automation cost?',
        a: 'Simple flows like form to email or lead routing are often quoted as small fixed projects. Larger workflows are scoped at R500/hour.',
      },
      {
        q: 'What about platform subscription fees?',
        a: 'Automation platform fees and usage costs are separate unless included in the written proposal.',
      },
    ],
  },

  /* ── 8. Ecosystems ───────────────────────────────────────────────────────── */
  'ecosystems': {
    positioning:
      'Connected business ecosystems where your website, portal, dashboard, AI agent, automations, integrations, IoT systems, and marketing tools work together.',
    problem: [
      'Most businesses run on disconnected tools. The website does not talk to the CRM, the CRM does not talk to the spreadsheet, and people fill the gaps by hand.',
      'An ecosystem connects everything into one system with one source of truth, so admin shrinks and visibility grows.',
    ],
    solution: [
      'Start with one service and expand over time',
      'Connect customer facing and internal systems',
      'Reduce duplicated admin',
      'Build one source of truth',
      'Upgrade paths from website to portal to dashboard to AI to automation',
      'Ideal when multiple disconnected tools need to become one scalable system',
    ],
    customPricing: {
      lines: [
        'Custom quoted after discovery.',
        `Standard custom rate: ${CUSTOM_RATE}.`,
        'Larger ecosystems begin with a paid discovery and system map where needed.',
      ],
      exclusions: THIRD_PARTY_NOTE,
    },
    deliverables: [
      'A system map of your connected ecosystem',
      'Phased delivery plan with clear priorities',
      'Integrated systems that share data correctly',
      'Documentation and a long term growth roadmap',
    ],
    faqs: [
      {
        q: 'Do I need everything at once?',
        a: 'No. Ecosystems are built in phases. Most clients start with a website, portal, or automation and connect more over time.',
      },
      {
        q: 'What is a system map?',
        a: 'A practical blueprint of your pages, workflows, automations, integrations, dashboards, and user roles. It shows what to build first and how everything connects.',
      },
      {
        q: 'How is an ecosystem priced?',
        a: 'Each phase is quoted separately after discovery, at R500/hour or as fixed project prices per phase.',
      },
    ],
  },

  /* ── 9. AI Implementation ────────────────────────────────────────────────── */
  'ai-implementation': {
    positioning:
      'Practical AI inside your workflows, not generic chatbot advice.',
    problem: [
      'Everyone says "use AI" but nobody shows where it actually saves time in your business. Tools get tried, then abandoned.',
      'We find the workflows where AI genuinely helps, implement it properly, and put human review where it matters.',
    ],
    solution: [
      'AI readiness audit',
      'Workflow review',
      'AI strategy',
      'Prompt systems',
      'Knowledge base planning',
      'AI assistants',
      'Staff workflows',
      'AI support agents',
      'AI document handling',
      'AI summaries',
      'AI integrated automations',
      'Human review and safety rules',
    ],
    customPricing: {
      lines: [
        `Consulting and implementation quoted at ${CUSTOM_RATE} unless a fixed package is agreed.`,
      ],
      exclusions: 'AI tool costs and AI usage costs are separate unless included in writing.',
    },
    deliverables: [
      'A clear AI implementation plan for your workflows',
      'Configured AI tools, assistants, or automations',
      'Prompt systems and knowledge bases your team can maintain',
      'Safety rules and human review steps',
    ],
    faqs: [
      {
        q: 'Where does AI actually help first?',
        a: 'Usually in answering repeat questions, summarising documents and conversations, qualifying leads, and routing work. The audit identifies your highest value starting points.',
      },
      {
        q: 'Is my data safe?',
        a: 'We plan data handling per tool, keep sensitive flows under human review, and document exactly what each AI system can see and do.',
      },
      {
        q: 'What does it cost?',
        a: 'Consulting and implementation are R500/hour unless a fixed package is agreed. AI tool and usage costs are separate unless included in writing.',
      },
    ],
  },

  /* ── 10. IoT Development ─────────────────────────────────────────────────── */
  'iot-development': {
    positioning:
      'Smart device and IoT solutions for homes, offices, work environments, operations, monitoring, alerts, and connected dashboards.',
    problem: [
      'Devices, sensors, and environments generate useful information, but without the right software it never reaches the people who need it.',
      'We connect devices to dashboards, alerts, and automations so physical and digital systems work as one.',
    ],
    solution: [
      'Smart home systems',
      'Smart workplace systems',
      'Sensor dashboards',
      'Alerts and notifications',
      'Device data collection',
      'Environmental monitoring',
      'Automation triggers',
      'Custom device interfaces',
      'Integration with dashboards, AI agents, portals, and workflow systems',
    ],
    customPricing: {
      lines: [
        'Custom quoted after discovery.',
        `Standard custom rate: ${CUSTOM_RATE} for planning, software, dashboards, integrations, and configuration.`,
      ],
      exclusions:
        'Hardware, sensors, devices, installation, connectivity, cloud services, and third party platforms are separate unless included in the written quote.',
    },
    deliverables: [
      'A working connected system for your devices or environment',
      'Dashboards and alerts for the data that matters',
      'Integration with your other business systems where scoped',
      'Documentation and support options',
    ],
    faqs: [
      {
        q: 'Do you supply the hardware?',
        a: 'Hardware, sensors, and installation are quoted separately or supplied by you. We handle the planning, software, dashboards, and integrations.',
      },
      {
        q: 'What can be monitored?',
        a: 'Anything a sensor can measure: temperature, power, movement, occupancy, equipment status, and more, with alerts and dashboards built around it.',
      },
      {
        q: 'How is IoT work priced?',
        a: 'Custom quoted after discovery at R500/hour for planning, software, and configuration, or as a fixed project once scope is clear.',
      },
    ],
  },

  /* ── 11. Marketing & SEO ─────────────────────────────────────────────────── */
  'marketing-seo': {
    positioning:
      'Marketing and SEO support that improves visibility, trust, lead capture, and AI search readiness.',
    problem: [
      'A good website that nobody finds is a brochure in a drawer. Rankings, local visibility, tracking, and content all need consistent attention.',
      'We build the marketing foundation and keep it improving month after month.',
    ],
    solution: [
      'SEO foundation',
      'Local visibility',
      'AI search optimisation structure',
      'Google Business Profile',
      'Website content and copywriting',
      'Tracking and analytics',
      'Paid ads setup and management',
      'Content strategy',
      'Marketing dashboards',
      'Lead capture and conversion tracking',
    ],
    addonsTitle: 'Marketing & SEO pricing',
    addons: [
      { label: 'Basic SEO', price: 'R300/month' },
      { label: 'Local SEO', price: 'R750/month' },
      { label: 'Growth SEO', price: 'R1,500/month' },
      { label: 'Advanced SEO', price: 'From R3,000/month' },
      { label: 'Google Business Profile setup', price: 'R750' },
      { label: 'Google Business Profile optimisation', price: 'R1,500' },
      { label: 'Blog post writing', price: 'R500 to R1,500/post' },
      { label: 'Website content writing (basic)', price: 'R300/page' },
      { label: 'SEO copywriting', price: 'R750 to R1,500/page' },
      { label: 'Google Analytics + Meta Pixel setup', price: 'R1,000' },
      { label: 'Advanced tracking setup', price: 'R3,500 to R9,500' },
      { label: 'Google and Meta Ads management', price: '10% of ad spend, minimum R500/month' },
      { label: 'Social media management starter', price: 'From R1,500/month' },
      { label: 'Social media management growth', price: 'From R3,500/month' },
      { label: 'Blog and content management', price: 'From R1,500/month' },
      { label: 'Marketing strategy and campaigns', price: 'Quote on request' },
      { label: 'Custom marketing system work', price: 'R500/hour' },
    ],
    notes: ['Paid ads spend is paid directly to the ad platforms and is separate from management fees.'],
    deliverables: [
      'A clear monthly plan matched to your goals',
      'Implemented SEO, content, and tracking work',
      'Reporting you can actually read',
      'Recommendations that compound month over month',
    ],
    faqs: [
      {
        q: 'How long before SEO shows results?',
        a: 'Local visibility improvements often show within weeks. Broader ranking growth typically builds over 3 to 6 months of consistent work.',
      },
      {
        q: 'What is AI search optimisation?',
        a: 'Structuring your content so AI assistants and answer engines can find, understand, and cite your business, alongside traditional search.',
      },
      {
        q: 'Is ad spend included in management fees?',
        a: 'No. Ad spend is paid directly to Google or Meta. Management is 10% of ad spend with a minimum of R500/month.',
      },
    ],
  },
}
