// ── Custom Solutions section — editable content ─────────────────────────────
//
// The Section-5 layout renders entirely from these arrays. Add, remove, or
// reorder entries here — no JSX changes needed.
//
// `icon` is a string key resolved to a line icon inside
// CustomPossibilitiesSection.jsx (see SOLUTION_ICONS there). Available keys:
//   code, user, bars, chat, bolt, calc, calendar, route, file, checklist,
//   menu, flow, wrench, spark, chip, bell, globe, funnel, shield, layers,
//   search, book

export const CUSTOM_SECTION_COPY = {
  eyebrow: 'Custom Solutions',
  title: 'What could we build around your business?',
  sub: 'We design and build custom systems that fit the way your business runs, not the other way around.',
}

/* ── Featured solution groups (the 6 cards) ──────────────────────────────────
   Each: title, icon key, 4–6 specific examples, one line business value. */
export const customSolutionGroups = [
  {
    title: 'Client & Customer Systems',
    icon: 'user',
    examples: [
      'Client portals',
      'Customer onboarding flows',
      'Document collection portals',
      'Service request systems',
      'Customer status tracking',
      'Client communication hubs',
    ],
    businessValue:
      'Give customers one place to submit, track, and communicate without constant back and forth.',
  },
  {
    title: 'Internal Business Tools',
    icon: 'wrench',
    examples: [
      'Staff dashboards',
      'Job tracking tools',
      'Internal admin panels',
      'Approval systems',
      'Task management tools',
      'Team handover systems',
    ],
    businessValue:
      'Replace spreadsheets, WhatsApp chaos, and manual tracking with structured internal tools.',
  },
  {
    title: 'Time Saving Automations',
    icon: 'bolt',
    examples: [
      'Lead routing',
      'Quote follow ups',
      'Email and WhatsApp workflows',
      'Reminder systems',
      'Form to dashboard automation',
      'Invoice and document reminders',
    ],
    businessValue:
      'Automate repetitive work so your team can move faster with fewer missed tasks.',
  },
  {
    title: 'AI Assistants & Agents',
    icon: 'spark',
    examples: [
      'Website chat agents',
      'WhatsApp support agents',
      'Internal staff assistants',
      'Knowledge base assistants',
      'Booking assistants',
      'AI enquiry qualification',
    ],
    businessValue:
      'Give customers and staff faster answers while keeping important conversations organized.',
  },
  {
    title: 'Data, Reporting & Dashboards',
    icon: 'bars',
    examples: [
      'Sales dashboards',
      'Operations dashboards',
      'Lead tracking dashboards',
      'KPI reporting systems',
      'Management reports',
      'Automated data summaries',
    ],
    businessValue:
      'Turn scattered business activity into clear, useful information for better decisions.',
  },
  {
    title: 'Industry Specific Systems',
    icon: 'layers',
    examples: [
      'Inspection systems',
      'Digital menus',
      'Booking platforms',
      'Property management tools',
      'Training portals',
      'Service business job boards',
    ],
    businessValue:
      'Build software around the real workflow of your industry, not generic templates.',
  },
]

/* ── Possibility chip library ────────────────────────────────────────────────
   The horizon shows the first HORIZON_CHIP_COUNT chips (set in the component);
   reorder this list to change what is featured. */
export const possibilityChips = [
  // Featured on the horizon (first 12: lane A is the first 6, lane B the rest)
  { label: 'Booking Systems',         icon: 'calendar',  category: 'Industry Specific Systems' },
  { label: 'Document Collection',     icon: 'file',      category: 'Client & Customer Systems' },
  { label: 'Custom Internal Tools',   icon: 'code',      category: 'Internal Business Tools' },
  { label: 'Client Portals',          icon: 'user',      category: 'Client & Customer Systems' },
  { label: 'Smart Dashboards',        icon: 'bars',      category: 'Data, Reporting & Dashboards' },
  { label: 'AI Chat Agents',          icon: 'spark',     category: 'AI Assistants & Agents' },
  { label: 'Project Trackers',        icon: 'checklist', category: 'Internal Business Tools' },
  { label: 'Inspection Systems',      icon: 'search',    category: 'Industry Specific Systems' },
  { label: 'CRM Workflows',           icon: 'flow',      category: 'Time Saving Automations' },
  { label: 'Reporting Systems',       icon: 'bars',      category: 'Data, Reporting & Dashboards' },
  { label: 'IoT Integrations',        icon: 'chip',      category: 'Industry Specific Systems' },
  { label: 'Staff Dashboards',        icon: 'user',      category: 'Internal Business Tools' },
  // Library — promote any of these up to feature them on the horizon
  { label: 'WhatsApp Automations',    icon: 'chat',      category: 'Time Saving Automations' },
  { label: 'Quote Calculators',       icon: 'calc',      category: 'Client & Customer Systems' },
  { label: 'Lead Routing',            icon: 'route',     category: 'Time Saving Automations' },
  { label: 'Knowledge Bases',         icon: 'book',      category: 'AI Assistants & Agents' },
  { label: 'Lead Management',         icon: 'funnel',    category: 'Time Saving Automations' },
  { label: 'Approval Workflows',      icon: 'flow',      category: 'Internal Business Tools' },
  { label: 'Custom Websites',         icon: 'code',      category: 'Client & Customer Systems' },
  { label: 'Reminder Systems',        icon: 'bell',      category: 'Time Saving Automations' },
  { label: 'Landing Pages',           icon: 'globe',     category: 'Client & Customer Systems' },
  { label: 'Supplier Portals',        icon: 'user',      category: 'Client & Customer Systems' },
  { label: 'Staff Portals',           icon: 'user',      category: 'Internal Business Tools' },
  { label: 'Customer Onboarding',     icon: 'route',     category: 'Client & Customer Systems' },
  { label: 'Job Tracking',            icon: 'checklist', category: 'Internal Business Tools' },
  { label: 'Task Dashboards',         icon: 'bars',      category: 'Internal Business Tools' },
  { label: 'Follow Up Automation',    icon: 'bolt',      category: 'Time Saving Automations' },
  { label: 'Email Automations',       icon: 'bolt',      category: 'Time Saving Automations' },
  { label: 'Google Workspace Automation', icon: 'bolt',  category: 'Time Saving Automations' },
  { label: 'Internal Admin Panels',   icon: 'wrench',    category: 'Internal Business Tools' },
  { label: 'Staff Handover Tools',    icon: 'route',     category: 'Internal Business Tools' },
  { label: 'Maintenance Trackers',    icon: 'wrench',    category: 'Internal Business Tools' },
  { label: 'Inventory Trackers',      icon: 'layers',    category: 'Internal Business Tools' },
  { label: 'Service Request Portals', icon: 'user',      category: 'Client & Customer Systems' },
  { label: 'Customer Support Systems', icon: 'chat',     category: 'Client & Customer Systems' },
  { label: 'AI Voice Assistants',     icon: 'spark',     category: 'AI Assistants & Agents' },
  { label: 'AI Staff Assistants',     icon: 'spark',     category: 'AI Assistants & Agents' },
  { label: 'AI Reply Assistants',     icon: 'spark',     category: 'AI Assistants & Agents' },
  { label: 'AI Sales Assistants',     icon: 'spark',     category: 'AI Assistants & Agents' },
  { label: 'KPI Dashboards',          icon: 'bars',      category: 'Data, Reporting & Dashboards' },
  { label: 'Management Reports',      icon: 'file',      category: 'Data, Reporting & Dashboards' },
  { label: 'Automated Reporting',     icon: 'bars',      category: 'Data, Reporting & Dashboards' },
  { label: 'Data Collection Forms',   icon: 'file',      category: 'Data, Reporting & Dashboards' },
  { label: 'Form to Dashboard Systems', icon: 'flow',    category: 'Data, Reporting & Dashboards' },
  { label: 'Digital Menus',           icon: 'menu',      category: 'Industry Specific Systems' },
  { label: 'Branch Management Portals', icon: 'layers',  category: 'Industry Specific Systems' },
  { label: 'Payment Integrations',    icon: 'calc',      category: 'Time Saving Automations' },
  { label: 'Notification Systems',    icon: 'bell',      category: 'Time Saving Automations' },
  { label: 'Training Portals',        icon: 'file',      category: 'Industry Specific Systems' },
  { label: 'Compliance Trackers',     icon: 'shield',    category: 'Internal Business Tools' },
  { label: 'File Upload Portals',     icon: 'file',      category: 'Client & Customer Systems' },
  { label: 'Project Status Portals',  icon: 'route',     category: 'Client & Customer Systems' },
  { label: 'Customer Feedback Systems', icon: 'chat',    category: 'Client & Customer Systems' },
  { label: 'Review Collection Systems', icon: 'chat',    category: 'Time Saving Automations' },
  { label: 'Marketing Funnels',       icon: 'funnel',    category: 'Time Saving Automations' },
  { label: 'Campaign Landing Pages',  icon: 'globe',     category: 'Client & Customer Systems' },
  { label: 'Social Media Content Workflows', icon: 'flow', category: 'Time Saving Automations' },
  { label: 'Newsletter Automations',  icon: 'bolt',      category: 'Time Saving Automations' },
  { label: 'Simple Mobile Web Apps',  icon: 'globe',     category: 'Industry Specific Systems' },
  { label: 'Custom Business Tools',   icon: 'wrench',    category: 'Internal Business Tools' },
]
