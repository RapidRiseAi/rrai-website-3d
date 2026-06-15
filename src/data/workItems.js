// ── "Our Work" section — editable work-item list ────────────────────────────
//
// The Section-4 layout renders ENTIRELY from this array: add, remove, reorder
// or replace items here and the section updates — no JSX changes needed.
//
// Field reference (per item):
//   id                 unique stable string (used as the React key)
//   number             display number ('01'…). Optional — omit it and the row
//                      auto-numbers from its position in the array.
//   title              project name shown in the list row and preview
//   status             honest label — one of: 'Live Project' | 'Demo Build' |
//                      'Product Concept' | 'Internal Build' | 'Prototype'.
//                      Never present demos/concepts as paid client work.
//   tags               service chips (small pills; icons matched by keyword)
//   shortDescription   concise one liner (kept in the data for project pages /
//                      future layouts; the preview panel shows previewDescription)
//   previewDescription longer copy for the preview panel
//   highlights         3–4 bullet feature points for the preview panel
//   ctaLabel           preview button text ('View Project', 'View Demo', …)
//   href               internal route. If a real product page exists use it
//                      (see src/data/services.js slugs); otherwise point at the
//                      closest /services/:slug page until a project page exists.
//   mediaType          'image' | 'video' | 'mock'
//   mediaSrc           path/URL of the preview media (image/video types)
//   mockKind           for mediaType 'mock': which ConceptPreview mockup to
//                      render ('website' | 'portal' | 'inspection' | 'menu' |
//                      'chat' | 'dashboard'). Swap to a real image once a
//                      capture exists.
//   mediaAlt           accessible description of the media

export const WORK_SECTION_COPY = {
  eyebrow: 'Proof & Builds',
  title: 'Our Work',
  sub: 'Explore selected systems, demos, and digital builds that show how Rapid Rise AI turns business ideas into usable software, automation, and AI powered tools.',
}

export const WORK_ITEMS = [
  {
    id: 'rapid-rise-website',
    number: '01',
    title: 'Rapid Rise AI Website',
    status: 'Internal Build',
    tags: ['Website Design', '3D Experience', 'Web Development', 'Brand System'],
    shortDescription:
      'A premium interactive website built to position Rapid Rise AI as a modern AI, software, and connected systems company.',
    previewDescription:
      'A dark, 3D driven website experience with interactive objects, premium service sections, fixed pricing cards, and conversion focused CTAs.',
    highlights: [
      'Premium 3D hero experience',
      'Interactive service sections',
      'Fixed pricing package layout',
      'Conversion focused design system',
    ],
    ctaLabel: 'View Project',
    href: '/services/website-development',
    mediaType: 'mock',
    mockKind: 'website',
    mediaAlt: 'Rapid Rise AI website with interactive 3D homepage',
  },
  {
    id: 'client-portal-system',
    number: '02',
    title: 'Client Portal System',
    status: 'Demo Build',
    tags: ['Client Portals', 'Dashboards', 'Document Collection', 'Automation'],
    shortDescription:
      'A client portal concept for businesses that need to collect documents, manage clients, track progress, and reduce repetitive admin.',
    previewDescription:
      'A central portal where customers can submit information, upload documents, track status, and access updates without constant back and forth messages.',
    highlights: [
      'Client login area',
      'Document and form collection',
      'Status tracking',
      'Dashboard ready data',
    ],
    ctaLabel: 'View Product',
    href: '/services/client-portal',
    mediaType: 'mock',
    mockKind: 'portal',
    mediaAlt: 'Client portal dashboard with document collection and status tracking',
  },
  {
    id: 'building-inspection-system',
    number: '03',
    title: 'Building Inspection System',
    status: 'Prototype',
    tags: ['Custom Software', 'Inspection Tools', 'Mobile App', 'Reporting'],
    shortDescription:
      'A mobile first inspection system concept designed for building inspection teams that need structured checklists, image capture, severity tracking, and reporting.',
    previewDescription:
      'A field ready inspection workflow where teams can complete custom checklists, upload evidence, mark severity, and prepare structured reports.',
    highlights: [
      'Mobile first checklist flow',
      'Image and note capture',
      'Severity tracking',
      'Template builder concept',
    ],
    ctaLabel: 'View Prototype',
    href: '/services/software-development',
    mediaType: 'mock',
    mockKind: 'inspection',
    mediaAlt: 'Building inspection mobile checklist and reporting dashboard',
  },
  {
    id: 'digital-menu-system',
    number: '04',
    title: 'Digital Menu & Branch Management System',
    status: 'Demo Build',
    tags: ['Digital Menu', 'QR System', 'Management Portal', 'Hospitality'],
    shortDescription:
      'A branded digital menu concept for restaurants and bars with a single QR per branch and a management portal for updating menu items.',
    previewDescription:
      'A mobile first menu experience designed to make browsing easier for customers while giving the business control over pricing, items, categories, and branch menus.',
    highlights: [
      'Single QR per branch',
      'Mobile first menu',
      'Branch level menu control',
      'Admin management portal',
    ],
    ctaLabel: 'View Demo',
    href: '/services/web-app-development',
    mediaType: 'mock',
    mockKind: 'menu',
    mediaAlt: 'Restaurant digital menu on a phone with management portal',
  },
  {
    id: 'ai-communication-agent',
    number: '05',
    title: 'AI Communication Agent',
    status: 'Demo Build',
    tags: ['AI Agents', 'Support Automation', 'WhatsApp', 'Website Chat'],
    shortDescription:
      'An AI communication system concept for businesses that need to answer common questions, route enquiries, capture leads, and support customers faster.',
    previewDescription:
      'A connected AI assistant designed to handle website or WhatsApp conversations, answer from a knowledge base, and route important enquiries to the right team.',
    highlights: [
      'Website and WhatsApp support concept',
      'Knowledge base answers',
      'Lead capture flow',
      'Human handover path',
    ],
    ctaLabel: 'View Product',
    href: '/services/ai-communication-agent',
    mediaType: 'mock',
    mockKind: 'chat',
    mediaAlt: 'AI support chat interface answering customer questions',
  },
  {
    id: 'smart-business-dashboard',
    number: '06',
    title: 'Smart Business Dashboard',
    status: 'Demo Build',
    tags: ['Smart Dashboards', 'Analytics', 'Reporting', 'Automation'],
    shortDescription:
      'A dashboard concept that turns business activity, leads, tasks, and operational data into clear visual reporting.',
    previewDescription:
      'A smart dashboard built to help businesses understand performance, track activity, and make better decisions using live or automated data flows.',
    highlights: [
      'KPI overview',
      'Lead and task tracking',
      'Automated reporting',
      'Business performance visibility',
    ],
    ctaLabel: 'View Product',
    href: '/services/smart-dashboards',
    mediaType: 'mock',
    mockKind: 'dashboard',
    mediaAlt: 'Business analytics dashboard with KPIs and reporting',
  },
]
