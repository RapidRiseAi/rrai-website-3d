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
      'Your digital first impression, built to convert visitors into leads.',
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
      'One branded hub that replaces email chains and status check calls.',
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
      'Every number that matters, in one screen, instead of ten tabs.',
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
      'A 24/7 front line that answers, qualifies, and routes before a human has to.',
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
        price: 'From R1,000 setup',
        monthly: 'R650/month',
        summary: 'A website support agent that answers your most common questions.',
        features: [
          '1 website AI support agent',
          'Website chat widget only',
          'Basic business info setup',
          'Basic lead capture',
          'Basic human handover message',
          'Basic testing and maintenance',
        ],
        limits: [
          'Knowledge base: 100 MB included',
          'AI spend: R50/mo included',
          'Support: 15 min/mo',
        ],
      },
      {
        name: 'AI Agent Essential',
        price: 'From R3,500 setup',
        monthly: 'R1,200/month',
        summary: 'Better conversations, lead routing, and your first integration.',
        features: [
          'Everything in Starter',
          'Better conversation structure',
          'Lead capture to email or Google Sheets',
          'Service and product guidance',
          'Enquiry routing',
          'Appointment request flow',
          '1 simple integration',
        ],
        limits: [
          'Knowledge base: 250 MB included',
          'AI spend: R100/mo included',
          'Support: 30 min/mo',
        ],
      },
      {
        name: 'AI Agent Growth',
        price: 'From R7,500 setup',
        monthly: 'R2,200/month',
        badge: 'Recommended',
        summary: 'Two channels, bookings, intake forms, and staff notifications.',
        features: [
          'Everything in Essential',
          'Up to 2 channels',
          'Basic availability checking',
          'Booking request workflow',
          'Customer intake forms',
          'Automated staff notifications',
          'CRM or Google Sheets logging',
          'Conversation tags and categories',
          'Basic analytics',
          'Up to 3 integrations',
        ],
        limits: [
          'Knowledge base: 500 MB included',
          'AI spend: R250/mo included',
          'Support: 1 hr/mo',
        ],
      },
      {
        name: 'AI Agent Business',
        price: 'From R15,000 setup',
        monthly: 'R3,500/month',
        summary: 'Advanced booking logic, escalations, follow-ups, and a dashboard.',
        features: [
          'Everything in Growth',
          'Up to 3 channels',
          'Advanced booking and availability logic',
          'Customer status checks',
          'Internal staff alerts',
          'Follow-up messages',
          'Escalation rules',
          'Human handover workflow',
          'Basic internal dashboard',
          'Advanced lead qualification',
          'Up to 5 integrations',
        ],
        limits: [
          'Knowledge base: 1 GB included',
          'AI spend: R600/mo included',
          'Support: 2 hrs/mo',
        ],
      },
      {
        name: 'AI Agent Pro',
        price: 'From R30,000 setup',
        monthly: 'R6,500/month',
        summary: 'Omnichannel support with CRM updates, payments, and reminders.',
        features: [
          'Everything in Business',
          'Omnichannel setup',
          'Advanced workflows',
          'CRM updates',
          'Payment link generation',
          'Quote request automation',
          'Appointment confirmations and reminder flows',
          'Multi-language setup',
          'Advanced AI knowledge base',
          'Deeper analytics',
          'Priority support',
          'Up to 7 integrations',
        ],
        limits: [
          'Knowledge base: 1 GB+ (scoped per client)',
          'AI spend: custom allowance (scoped per client)',
          'Support: 4 hrs/mo',
        ],
      },
      {
        name: 'Custom AI Communication System',
        price: 'Any budget',
        monthly: 'Scoped to you',
        summary: "For businesses that need more than our standard plans, or a leaner setup without the features they won't use. Built to your exact requirements at any price range.",
        features: [
          'Everything in our standard plans, tailored to you',
          'Pick only the features you need, or go beyond every plan',
          'High volume WhatsApp and omnichannel support',
          'Multiple branches and departments',
          'Advanced CRM, booking engines, and payment systems',
          'Portals, dashboards, and internal staff workflows',
          'Custom APIs and voice AI options',
          'Advanced reporting and SLA support',
        ],
      },
    ],
    notes: [
      'Most of the logic runs on code and pre-built responses, with AI used only where it genuinely adds value, so your AI spend stays low and predictable instead of climbing with every message the way an AI-first system does.',
      'Agents answer only with facts from your approved knowledge base. They will not guess or invent information about your business.',
      'Included AI spend and knowledge base storage are per plan. Additional usage is billed via the add-ons below.',
      'WhatsApp, API, SMS, social inbox, and other third party platform fees are excluded unless included in writing.',
      'AI agents include human handover for sensitive or complex situations, and do not provide legal, medical, or financial advice.',
    ],
    addonsTitle: 'Add-ons and usage',
    addons: [
      { label: 'Additional knowledge base storage', price: 'R100/mo per 100 MB' },
      { label: 'Additional AI spend', price: 'Billed at cost + service margin' },
      { label: 'Extra support time', price: 'R350/hr' },
      { label: 'Additional integration', price: 'From R1,000 once-off setup' },
      { label: 'Extra channel (WhatsApp, Facebook, etc.)', price: 'From R1,200 once-off setup' },
    ],
    deliverables: [
      'A live AI agent on your chosen channels',
      'A knowledge base built from your business information',
      'Lead capture and logging wired to your tools',
      'Human handover and escalation rules',
      'Monthly maintenance, with included AI spend and knowledge base per plan',
    ],
    faqs: [
      {
        q: 'What happens when the AI cannot answer?',
        a: 'The agent hands the conversation to a human, with handover rules and staff alerts set up from the start. The question it could not answer is also saved to an unanswered questions log, where you add the correct answer. The next time it comes up, the agent already knows it, so your agent keeps getting smarter over time.',
      },
      {
        q: 'Will AI usage get expensive?',
        a: 'No. We build agents to run mostly on code and pre-built responses, using AI only where it genuinely helps. That keeps your AI spend low and predictable, unlike systems that route every message through AI, where costs can climb fast. Each plan includes a set AI spend allowance, and anything beyond it is billed at cost plus our service margin.',
      },
      {
        q: 'Can the agent make things up about my business?',
        a: 'No. Every agent answers only from facts in your approved knowledge base. It will not guess or invent details, so customers never get false information about your business.',
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
    positioning: 'Software shaped to how your business actually works.',
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
      "The right platform for your users, whether that's browser, app store, or both.",
    problem: [
      'You need a real product: logins, dashboards, workflows, payments. The real question is whether your users need it in the browser, as an installable app on their phone, or both.',
      'We build both, from the start. A web app reaches every device instantly through the browser; a publishable app lives on the App Store and Google Play with native features and offline access. We recommend the right mix for your requirements, not a one size fits all.',
    ],
    solution: [
      'SaaS style platforms',
      'Booking and member platforms',
      'Client and team dashboards',
      'Native iOS and Android apps published to the App Store and Google Play',
      'Cross platform mobile apps',
      'Progressive web apps (installable, offline ready)',
      'Admin portals and internal workflow apps',
      'Customer facing tools',
      'Web and app builds that share one connected backend, with upgrade paths into portals, dashboards, AI, and integrations',
    ],
    customPricing: {
      lines: ['Custom quoted after discovery.', `Standard custom rate: ${CUSTOM_RATE}.`],
      exclusions: THIRD_PARTY_NOTE,
    },
    deliverables: [
      'A working web app on your domain, and/or a published app on the App Store and Google Play',
      'User accounts and roles where scoped',
      'Admin tooling for your team',
      'App store submission and setup handled for you where a published app is in scope',
      'Documentation, training, and a growth roadmap',
    ],
    faqs: [
      {
        q: 'Web app, mobile app, or both?',
        a: 'Whatever your users actually need. Web apps work on every device through the browser and cost less to build and maintain. Publishable apps live on the Apple App Store and Google Play with native features like push notifications and offline use. We help you choose, and many clients ship both from one connected backend.',
      },
      {
        q: 'Do you publish apps to the Apple App Store and Google Play?',
        a: 'Yes. When a published app is the right fit, we build it and handle store submission and setup so it launches on the App Store and Google Play, not only in the browser.',
      },
      {
        q: 'How long does it take?',
        a: 'A focused first version typically takes 4 to 10 weeks depending on scope and whether it ships as a web app, a published app, or both. The timeline is confirmed in your proposal.',
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
      'The manual steps between your tools, gone.',
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
      'Every system you run, finally talking to each other.',
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
      'AI that does real work inside your business, not a chatbot demo.',
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
      'Physical spaces that report back, from sensors to dashboard.',
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
      'Found, trusted, and ranked, including by AI search.',
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
