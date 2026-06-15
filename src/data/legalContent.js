// ── Legal page content ───────────────────────────────────────────────────────
//
// Each document renders at its own top-level route (see App.jsx) through
// src/pages/LegalPage.jsx. Edit text here — no JSX changes needed.
//
// Body format per section: a string renders as a paragraph; an array of
// strings renders as a bullet list. Occurrences of the contact email become
// mailto links automatically.

export const LEGAL_EMAIL = 'team@rapidriseai.com'
export const LEGAL_LAST_UPDATED = 'Last updated: 11 June 2026'

export const LEGAL_NAV = [
  { slug: 'privacy-policy',             label: 'Privacy Policy' },
  { slug: 'terms-of-service',           label: 'Terms of Service' },
  { slug: 'popia-notice',               label: 'POPIA Notice' },
  { slug: 'paia-manual',                label: 'PAIA Manual' },
  { slug: 'cookie-notice',              label: 'Cookie Notice' },
  { slug: 'refund-cancellation-policy', label: 'Refund & Cancellation Policy' },
]

export const LEGAL_DOCS = {
  'privacy-policy': {
    title: 'Privacy Policy',
    intro:
      'This Privacy Policy explains how Rapid Rise AI (Pty) Ltd collects, uses, stores, and protects personal information when you use our website, contact us, request a quote, or use our services.',
    sections: [
      {
        heading: 'Who we are',
        body: [
          'Rapid Rise AI (Pty) Ltd is a South African company that provides software development, AI systems, automation, websites, portals, dashboards, and related digital services.',
        ],
      },
      {
        heading: 'Information we may collect',
        body: [
          'We may collect:',
          [
            'name and surname',
            'business name',
            'email address',
            'phone number',
            'project requirements',
            'messages or enquiries submitted through forms',
            'billing and payment information where applicable',
            'website usage information',
            'technical data such as browser, device, IP address, and analytics data',
            'information provided when using our systems or services',
          ],
        ],
      },
      {
        heading: 'How we use information',
        body: [
          'We use information to:',
          [
            'respond to enquiries',
            'prepare quotes and proposals',
            'deliver services',
            'manage client communication',
            'improve our website and services',
            'process billing and administration',
            'provide support',
            'comply with legal obligations',
            'protect our systems and prevent misuse',
          ],
        ],
      },
      {
        heading: 'Legal basis / lawful processing',
        body: [
          'We process personal information where it is necessary for:',
          [
            'performing a contract',
            'taking steps before entering into a contract',
            'complying with legal obligations',
            'legitimate business interests',
            'consent where required',
          ],
        ],
      },
      {
        heading: 'Sharing of information',
        body: [
          'We may share information with trusted service providers when needed to provide our services, including hosting providers, email tools, payment processors, automation tools, analytics tools, and development platforms.',
          'We do not sell personal information.',
        ],
      },
      {
        heading: 'Cross border processing',
        body: [
          'Some service providers may store or process data outside South Africa. Where this happens, we aim to use reputable providers and appropriate safeguards.',
        ],
      },
      {
        heading: 'Data security',
        body: [
          'We use reasonable technical and organisational measures to protect personal information, including access control, secure systems, and responsible data handling.',
        ],
      },
      {
        heading: 'Data retention',
        body: [
          'We keep personal information only for as long as reasonably necessary for the purpose collected, legal requirements, business records, support, or dispute resolution.',
        ],
      },
      {
        heading: 'Your rights',
        body: [
          'Depending on applicable law, you may request access to, correction of, deletion of, or objection to the processing of your personal information.',
        ],
      },
      {
        heading: 'Cookies and analytics',
        body: [
          'Our website may use cookies and analytics tools. See our Cookie Notice for more information.',
        ],
      },
      {
        heading: 'Contact',
        body: ['For privacy questions, contact: team@rapidriseai.com'],
      },
      {
        heading: 'Regulator contact',
        body: [
          'Users may contact the Information Regulator of South Africa if they believe their personal information rights have been infringed.',
        ],
      },
    ],
  },

  'terms-of-service': {
    title: 'Terms of Service',
    intro: 'These Terms of Service govern your use of the Rapid Rise AI website and services.',
    sections: [
      {
        heading: 'About Rapid Rise AI',
        body: [
          'Rapid Rise AI (Pty) Ltd provides websites, custom software, AI systems, automations, dashboards, portals, and related digital services.',
        ],
      },
      {
        heading: 'Use of our website',
        body: [
          'You may use this website for lawful purposes only. You may not attempt to disrupt, misuse, copy, attack, scrape, or interfere with the website or its systems.',
        ],
      },
      {
        heading: 'Quotes and proposals',
        body: [
          'Information on the website is general. Final pricing, scope, timelines, deliverables, and payment terms are confirmed in a written quote, proposal, or service agreement.',
        ],
      },
      {
        heading: 'Services',
        body: [
          'Services may include website development, hosting, maintenance, client portals, dashboards, AI systems, automation workflows, integrations, consulting, and custom development.',
        ],
      },
      {
        heading: 'Client responsibilities',
        body: [
          'Clients are responsible for providing accurate information, content, access, approvals, brand assets, account access, and feedback required to complete a project.',
        ],
      },
      {
        heading: 'Payments',
        body: [
          'Payment terms will be confirmed in the applicable quote, invoice, or agreement. Work may be paused if payments are overdue.',
        ],
      },
      {
        heading: 'Payment plans',
        body: [
          'Payment plans may be available by agreement. Payment plans do not remove the client’s obligation to pay the agreed full amount.',
        ],
      },
      {
        heading: 'Hosting and third party tools',
        body: [
          'Some services may depend on third party platforms, hosting providers, APIs, AI tools, automation platforms, or integrations. We are not responsible for outages, pricing changes, or limitations caused by third party providers.',
        ],
      },
      {
        heading: 'AI and automation limitations',
        body: [
          'AI and automation systems can improve efficiency but may produce errors or require human review. Clients remain responsible for reviewing important outputs and decisions.',
        ],
      },
      {
        heading: 'Intellectual property',
        body: [
          'Unless otherwise agreed in writing, Rapid Rise AI retains ownership of reusable frameworks, code libraries, internal tools, templates, and know how. Client specific deliverables and usage rights will be defined in the relevant agreement.',
        ],
      },
      {
        heading: 'Confidentiality',
        body: [
          'We aim to treat client information responsibly and confidentially, subject to legal requirements and service delivery needs.',
        ],
      },
      {
        heading: 'Limitation of liability',
        body: [
          'To the maximum extent allowed by law, Rapid Rise AI is not liable for indirect losses, loss of profits, loss of data, business interruption, or damages caused by third party services or client misuse.',
        ],
      },
      {
        heading: 'Changes to services or terms',
        body: [
          'We may update website content, service descriptions, pricing, or these terms from time to time.',
        ],
      },
      {
        heading: 'Contact',
        body: ['For questions, contact: team@rapidriseai.com'],
      },
    ],
  },

  'popia-notice': {
    title: 'POPIA Notice',
    intro:
      'This POPIA Notice explains how Rapid Rise AI (Pty) Ltd approaches the processing of personal information under South Africa’s Protection of Personal Information Act.',
    sections: [
      {
        heading: 'Responsible party',
        body: [
          'Rapid Rise AI (Pty) Ltd is the responsible party for personal information processed through our website, enquiries, and services, unless otherwise agreed.',
        ],
      },
      {
        heading: 'Types of personal information processed',
        body: [
          'We may process contact details, business details, project information, communication records, billing information, website usage data, technical data, and service related information.',
        ],
      },
      {
        heading: 'Purpose of processing',
        body: [
          'We process personal information to respond to enquiries, provide quotes, deliver services, manage projects, provide support, improve systems, comply with legal duties, and protect our business.',
        ],
      },
      {
        heading: 'Information Officer',
        body: [
          'Information Officer: Xander Blumenthal, CEO',
          'Email: team@rapidriseai.com',
          'Phone / WhatsApp: 064 903 1234',
        ],
      },
      {
        heading: 'Data subject rights',
        body: [
          'Data subjects may request access to their personal information, correction of inaccurate information, deletion where applicable, objection to processing, or further information about processing.',
        ],
      },
      {
        heading: 'Security safeguards',
        body: [
          'We use reasonable safeguards to protect personal information from loss, misuse, unauthorised access, disclosure, alteration, or destruction.',
        ],
      },
      {
        heading: 'Operators and service providers',
        body: [
          'We may use operators or service providers to support hosting, automation, analytics, payment processing, email communication, AI services, and project delivery.',
        ],
      },
      {
        heading: 'Cross border transfers',
        body: [
          'Some tools or service providers may process information outside South Africa. We aim to work with reputable providers and appropriate safeguards.',
        ],
      },
      {
        heading: 'Complaints',
        body: [
          'Questions or complaints can be sent to: team@rapidriseai.com',
          'Data subjects may also contact the Information Regulator of South Africa.',
        ],
      },
    ],
  },

  'paia-manual': {
    title: 'PAIA Manual',
    intro:
      'This PAIA Manual is prepared for Rapid Rise AI (Pty) Ltd to help people understand how to request access to records in terms of the Promotion of Access to Information Act.',
    note:
      'This page is a practical web version and may need to be replaced or supplemented with a formal downloadable PAIA Manual PDF.',
    sections: [
      {
        heading: 'Company details',
        body: [
          'Company name: Rapid Rise AI (Pty) Ltd',
          'Registration number: K2024727338',
          'Location: South Africa',
          'Email: team@rapidriseai.com',
          'Phone / WhatsApp: 064 903 1234',
          'Website: https://www.rapidriseai.com',
        ],
      },
      {
        heading: 'Head of private body / Information Officer',
        body: ['Name: Xander', 'Email: team@rapidriseai.com'],
      },
      {
        heading: 'Purpose of this manual',
        body: [
          'This manual explains how to request access to records held by Rapid Rise AI and provides contact details for access requests.',
        ],
      },
      {
        heading: 'Records that may be available',
        body: [
          'Categories may include:',
          [
            'company records',
            'client records',
            'supplier records',
            'employee or contractor records where applicable',
            'financial and accounting records',
            'service agreements',
            'project documentation',
            'website and marketing records',
            'policies and operational records',
          ],
        ],
      },
      {
        heading: 'How to request access',
        body: [
          'Requests must be submitted in writing to: team@rapidriseai.com',
          'A request should include:',
          [
            'requester name',
            'contact details',
            'description of the record requested',
            'reason for the request where required',
            'preferred form of access',
            'proof of identity where applicable',
          ],
        ],
      },
      {
        heading: 'Fees',
        body: ['Fees may apply as permitted under PAIA.'],
      },
      {
        heading: 'Grounds for refusal',
        body: [
          'Access may be refused where permitted by law, including where records contain personal information, confidential information, commercial information, privileged information, or security sensitive information.',
        ],
      },
      {
        heading: 'POPIA and personal information',
        body: ['Requests involving personal information will be handled in line with POPIA.'],
      },
      {
        heading: 'Information Regulator',
        body: [
          'Requests and complaints may also be directed to the Information Regulator of South Africa where applicable.',
        ],
      },
      {
        heading: 'Availability of this manual',
        body: [
          'This manual is available on the Rapid Rise AI website and may be updated from time to time.',
        ],
      },
    ],
  },

  'cookie-notice': {
    title: 'Cookie Notice',
    intro:
      'This Cookie Notice explains how Rapid Rise AI may use cookies and similar technologies on our website.',
    sections: [
      {
        heading: 'What cookies are',
        body: [
          'Cookies are small files or technologies that help websites remember information, improve functionality, understand usage, and support security or analytics.',
        ],
      },
      {
        heading: 'Types of cookies we may use',
        body: [
          'We may use:',
          [
            'essential cookies',
            'analytics cookies',
            'performance cookies',
            'preference cookies',
            'marketing or tracking cookies if enabled',
          ],
        ],
      },
      {
        heading: 'Why we use cookies',
        body: [
          'We use cookies to:',
          [
            'make the website work',
            'improve user experience',
            'understand website performance',
            'track traffic and usage patterns',
            'improve marketing and content where applicable',
          ],
        ],
      },
      {
        heading: 'Third party cookies',
        body: [
          'Some cookies may come from third party tools such as analytics, hosting, embedded media, or advertising tools.',
        ],
      },
      {
        heading: 'Managing cookies',
        body: [
          'Users can manage or block cookies through browser settings. Some website features may not work properly if cookies are disabled.',
        ],
      },
      {
        heading: 'Contact',
        body: ['For questions, contact: team@rapidriseai.com'],
      },
    ],
  },

  'refund-cancellation-policy': {
    title: 'Refund & Cancellation Policy',
    intro:
      'This Refund & Cancellation Policy explains the general approach to cancellations, refunds, deposits, and recurring services for Rapid Rise AI services.',
    sections: [
      {
        heading: 'Custom service nature',
        body: [
          'Many Rapid Rise AI services are custom built or involve planning, design, development, configuration, or setup work. Because of this, refunds depend on the stage of work completed and the agreement in place.',
        ],
      },
      {
        heading: 'Deposits and upfront payments',
        body: [
          'Deposits or upfront payments may be required to reserve work time, begin planning, or start development. Deposits may be non refundable once work has started, unless otherwise agreed in writing.',
        ],
      },
      {
        heading: 'Project cancellations',
        body: [
          'If a client cancels a project after work has started, Rapid Rise AI may charge for work completed, time spent, third party costs, setup costs, and committed resources.',
        ],
      },
      {
        heading: 'Monthly services',
        body: [
          'Monthly services such as hosting, maintenance, support, automation monitoring, or AI system support may require notice for cancellation. The notice period will be stated in the relevant agreement or invoice terms.',
        ],
      },
      {
        heading: 'Third party costs',
        body: [
          'Third party costs such as hosting, domains, plugins, APIs, automation platforms, AI tools, payment providers, and software licences may not be refundable by Rapid Rise AI.',
        ],
      },
      {
        heading: 'Refund requests',
        body: ['Refund requests must be submitted in writing to: team@rapidriseai.com'],
      },
      {
        heading: 'Payment plans',
        body: [
          'Where a payment plan is agreed, cancellation does not automatically remove the obligation to pay for work already completed or agreed setup costs.',
        ],
      },
      {
        heading: 'Final terms',
        body: [
          'Specific quote, proposal, invoice, or service agreement terms will apply where they differ from this general policy.',
        ],
      },
    ],
  },
}
