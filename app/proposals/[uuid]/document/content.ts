// Hardcoded boilerplate copy for the client-facing proposal document —
// identical on every proposal, mirrors Tory's sales PDF template exactly.
// Per-client data (client name, scope of work, pricing, scheduling) lives on
// the Proposal record and is passed into the page components separately.

export const FOUNDER = {
  name: "Tory Papa",
  title: "Founder/Managing Director",
  phone: "0420 781 116",
  website: "www.easternsuburbscleaninggroup.com.au",
  email: "tory@easternsuburbscleaninggroup.com.au",
};

export const LETTER_PARAGRAPHS: string[] = [
  "I hope this letter finds you well.",
  "My name is Tory Papa and I am the proud owner of Eastern Suburbs Cleaning Group.",
  "At Eastern Suburbs Cleaning Group, we understand that you require professional, reliable and competent cleaners to provide your building and clients with the best experience while at your facility.",
  "We take pride in our commitment to deliver a quality service that encompasses a high standard of cleaning, timely responses to enquiries, accommodating to special requests and systems that ensure efficiency and consistency.",
  "With a proven track record of providing these qualities to our current clients, we believe we are capable of providing a service that goes above and beyond ensuring your peace of mind that you have chosen the right company.",
  "By choosing Eastern Suburbs Cleaning Group, you can rest assured that you will receive the highest quality service.",
  "Thank you for considering our cleaning proposal.",
  "We look forward to the opportunity to discuss your requirements in more detail and demonstrate how our services can benefit you.",
];

export const FEATURES: { title: string; description: string }[] = [
  {
    title: "Digital staff tracking & quality control",
    description: "GPS/geofenced check-in/out, QR-coded checklists, photo proof, live dashboards.",
  },
  {
    title: "24/7 direct access to our support team",
    description: "Phone, WhatsApp and email with clear SLAs (urgent within 6 hrs; routine within 24 hrs).",
  },
  {
    title: "Highly trained staff",
    description: "Cleaning techniques, cross-contamination control, chemical safety (SDS/SWMS), PPE and site inductions.",
  },
  {
    title: "Dedicated Site Manager & escalation path",
    description: "Single point of contact, weekly walk-throughs, monthly reviews.",
  },
  {
    title: "Audit-ready WHS & compliance",
    description: "SWMS library, SDS register, incident reporting, colour-coding, WWCC where required.",
  },
  {
    title: "Measurable KPIs & monthly reporting",
    description: "Audit scores, frequency compliance, complaint ageing, time-on-site, corrective actions.",
  },
  {
    title: "Zero-disruption mobilisation",
    description: "Site start-up plan, induction, baseline photos and quick wins in the first 30 days.",
  },
  {
    title: "Consumables management",
    description: "Par levels, usage logs, proactive restocking, transparent pass-through pricing if we supply.",
  },
  {
    title: "Relief/backup staffing",
    description: "Trained floaters to cover leave or absence so standards never slip.",
  },
  {
    title: "Fully insured & verified",
    description: "Public Liability ($20m) and Workers Compensation certificates available on request.",
  },
  {
    title: "Premium & sustainable practices",
    description: "Eco-labelled chemicals, microfibre systems, waste-separation and low-odour options.",
  },
  {
    title: "Secure access & key control",
    description: "Key register, alarm code handling, confidentiality and privacy protocols.",
  },
  {
    title: "Transparent scope & variations",
    description: "Clear inclusions, seasonal deep-clean options, written approval for any out-of-scope work.",
  },
];

export const INSURANCE_ROWS: {
  policyType: string;
  coverage: string;
  insurer: string;
  policyNumber: string;
  expiryDate: string;
}[] = [
  {
    policyType: "Public Liability Insurance",
    coverage: "$10,000,000 per claim / $10,000,000 aggregate",
    insurer: "AAMI",
    policyNumber: "SPD014782382",
    expiryDate: "19 June 2026",
  },
  {
    policyType: "Workcover",
    coverage: "As Per The Act",
    insurer: "Icare",
    policyNumber: "242703801",
    expiryDate: "30 June 2026",
  },
];

export const TERMS_SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "Term of Agreement",
    body: "The term of this agreement shall commence on the effective date and continue on a month-to-month basis. Either party may terminate this agreement with 30 days' written notice, effective at the end of the current month. The agreement will be automatically renewed unless a written termination notice is provided. Performance-based Agreement: Eastern Suburbs Cleaning Group offers all new clients a 1-month performance probation to ensure service delivery to satisfaction.",
  },
  {
    heading: "Pricing & Invoicing",
    body: "Invoices are issued on the 1st of each month in advance and are due for payment within 7 days. If any changes are made to the scope of services, a revised agreement will be created. Annually, at the 12-month anniversary, Eastern Suburbs Cleaning Group reserves the right to increase service fees by a maximum of 6% or the percentage change in the CPI, whichever is lower.",
  },
  {
    heading: "Cancellation & Rescheduling",
    body: "Cancellation: Client must provide at least 30 working days' notice to cancel a service. Rescheduling: Client must provide at least 3 days' notice to reschedule a service. If rescheduling occurs on the same day or while Eastern Suburbs Cleaning Group is already onsite, a $50 fee may apply.",
  },
  {
    heading: "Liability & Insurance",
    body: "Eastern Suburbs Cleaning Group holds valid insurance for damages or accidents that occur during the cleaning service, excluding damages to items such as cash, jewelry, art, or antiques. The Client agrees to indemnify Eastern Suburbs Cleaning Group against any claims arising from the Client's failure to fulfil their responsibilities under this Agreement.",
  },
  {
    heading: "Termination of Agreement",
    body: "Either party may terminate this Agreement with 30 days' written notice. Eastern Suburbs Cleaning Group reserves the right to terminate this Agreement with immediate effect if the Client breaches any terms that cannot be rectified within 30 days of written notice.",
  },
];

export const ADDITIONAL_SERVICES_INTRO =
  "In addition to our regular cleaning programs, we offer a comprehensive range of specialised services designed to restore, protect, and enhance the presentation and hygiene of your facilities. These services are available as part of ongoing maintenance schedules or as one-off projects, depending on your site's requirements.";

export const ADDITIONAL_SERVICES: string[] = [
  "Deep Cleaning Services",
  "Carpet Cleaning",
  "Pressure Washing",
  "Hard Floor Scrubbing",
  "Strip and Reseal",
  "Waste Removal and Disposal",
  "Supply Consumables",
  "Car Park and Warehouse Sweep & Scrubbing",
];

export const QUALITY_OBJECTIVE =
  "Our objective is to maintain a consistent, audit-ready standard of presentation and hygiene aligned to the principles of ISO 9001 (Quality), ISO 45001 (WHS) and ISO 14001 (Environmental). Quality is planned, measured and improved through documented SOPs, digital controls, and time-bound corrective actions.";

export const QUALITY_OUTCOMES: string[] = [
  "Consistent presentation during trading/inspection times",
  "Safe, compliant operations with zero tolerance for uncontrolled risk",
  "Fast communication and transparent KPI reporting",
];

export const QUALITY_ROLES: { role: string; description: string }[] = [
  {
    role: "Contract Manager",
    description: "Accountable for quality; conducts monthly audits, chairs client reviews, owns escalations.",
  },
  {
    role: "Site Supervisor",
    description: "Manages roster, onsite training, weekly inspections and CAPA close-out.",
  },
  {
    role: "Cleaning Team",
    description: "Executes SOPs/SWMS, completes digital checklists, reports hazards/incidents.",
  },
];

export const QUALITY_WHATSAPP_NOTE =
  "A site WhatsApp group (client + supervisor + Contract Manager) provides 24/7 communication and a clear escalation path.";

export const QUALITY_STANDARDS: string[] = [
  "Site-specific scope & frequencies by area with visual standards.",
  "SOPs for bathrooms, kitchens, offices, glass, floors, waste and periodics.",
  "Colour-coding to prevent cross-contamination.",
  "WHS: task-specific SWMS, SDS register, PPE rules, incident & hazard reporting.",
  "Child-related settings: WWCC verification where required.",
  "All documents live in the Site Information Folder (digital + onsite).",
];

export type ColourCodeRow = {
  color: "blue" | "red" | "yellow" | "white" | "green";
  label: string;
  description: string;
};

export const COLOUR_CODE_ROWS: ColourCodeRow[] = [
  { color: "blue", label: "Blue", description: "General areas including Offices and wards, etc." },
  { color: "red", label: "Red", description: "Toilets, Bathroom, and dirty Utility Rooms." },
  { color: "yellow", label: "Yellow", description: "Infectious and Isolation Areas." },
  { color: "white", label: "White", description: "Operating Theatres (inside red lines)" },
  { color: "green", label: "Green", description: "Kitchens, cafes, and food preparation areas." },
];

export const BEST_PRACTICE_TIPS: string[] = [
  "Cleaning equipment must be maintained, used and stored or disposed of in accordance with the manufacturer's instructions and in a designated area.",
  "Before commencing a cleaning task, check that the selected equipment is in good working order and appropriate for the cleaning task.",
  "Always change gloves between cleaning tasks.",
  "If unsure, ask a manager/supervisor.",
];

export const MICROFIBRE_CLOTH_STEPS: string[] = [
  "Upon completion of use, ensure to rinse the microfibre cloths thoroughly with clean and hot water.",
  "Submerge the cloths in a sanitising solution for a minimum of 5 minutes.",
  "After the sanitising process, rinse the cloths once again with clean and hot water.",
  "Sort the microfibre cloths by their respective colours and hang them separately on the appropriate drying rack designated for each colour.",
  "Any microfibre cloths that are discoloured or damaged should be discarded.",
];

export const MICROFIBRE_MOP_STEPS: string[] = [
  "Squeeze out the mop and dispose of the dirty water in the designated area.",
  "Rinse both the mop head and bucket thoroughly with clean, hot water.",
  "Ensure that mop heads of different colours are kept separate to prevent cross-contamination.",
  "Fill the bucket a quarter full with sanitising solution.",
  "Submerge the mop in the solution until it is needed for use again.",
  "Before using the mop again, empty the sanitising solution and rinse the mop and bucket thoroughly.",
];
