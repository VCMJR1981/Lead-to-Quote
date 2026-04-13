export const TRADES = {
  plumber: {
    name: 'Plumber', namePT: 'Canalizador',
    jobTypes: ['Emergency callout','Pipe repair','Boiler service','New bathroom installation','Leak detection','Drain unblocking','Water heater replacement'],
    defaultItems: [
      { name: 'Labor (hourly)', qty: 2, unit_price: 70 },
      { name: 'Call-out fee', qty: 1, unit_price: 50 },
      { name: 'Parts', qty: 1, unit_price: 0 },
    ],
  },
  electrician: {
    name: 'Electrician', namePT: 'Eletricista',
    jobTypes: ['Fault finding','Consumer unit upgrade','New sockets/lighting','EV charger installation','Full rewire','Partial rewire','PAT testing','Outdoor electrics'],
    defaultItems: [
      { name: 'Labor (hourly)', qty: 2, unit_price: 65 },
      { name: 'Call-out fee', qty: 1, unit_price: 50 },
      { name: 'Materials', qty: 1, unit_price: 0 },
      { name: 'Certification fee', qty: 1, unit_price: 150 },
    ],
  },
  carpenter: {
    name: 'Carpenter', namePT: 'Carpinteiro',
    jobTypes: ['Fitted wardrobes','Kitchen fitting','Skirting & architrave','Staircase repair','Decking','Door fitting','Bespoke furniture','Flooring installation'],
    defaultItems: [
      { name: 'Labor (day rate)', qty: 1, unit_price: 280 },
      { name: 'Materials', qty: 1, unit_price: 0 },
      { name: 'Hardware/fixings', qty: 1, unit_price: 0 },
    ],
  },
  hvac: {
    name: 'Air Conditioning / HVAC', namePT: 'Ar Condicionado / AVAC',
    jobTypes: ['New AC installation (split unit)','New AC installation (multi-split)','Annual service/maintenance','Gas top-up','Repair/fault diagnosis','Ventilation installation','Heat pump installation'],
    defaultItems: [
      { name: 'Labor', qty: 1, unit_price: 200 },
      { name: 'AC unit supply', qty: 1, unit_price: 0 },
      { name: 'Pipework', qty: 1, unit_price: 0 },
      { name: 'Commissioning fee', qty: 1, unit_price: 150 },
    ],
  },
  painter: {
    name: 'Painter & Decorator', namePT: 'Pintor',
    jobTypes: ['Interior painting','Exterior painting','Wallpapering','Feature wall','Commercial repaint','Woodwork/gloss'],
    defaultItems: [
      { name: 'Labor (day rate)', qty: 1, unit_price: 250 },
      { name: 'Paint supply', qty: 1, unit_price: 0 },
      { name: 'Preparation materials', qty: 1, unit_price: 50 },
    ],
  },
  roofer: {
    name: 'Roofer', namePT: 'Telhados',
    jobTypes: ['Roof repair (slates/tiles)','Full re-roof','Flat roof repair','Flat roof replacement','Gutter installation/repair','Chimney repair','Fascia & soffit'],
    defaultItems: [
      { name: 'Labor', qty: 1, unit_price: 0 },
      { name: 'Materials', qty: 1, unit_price: 0 },
      { name: 'Scaffolding hire', qty: 1, unit_price: 0 },
      { name: 'Skip hire', qty: 1, unit_price: 0 },
    ],
  },
  tiler: {
    name: 'Tiler', namePT: 'Azulejador',
    jobTypes: ['Bathroom tiling','Kitchen splashback','Floor tiling','Outdoor/patio tiling','Re-grouting'],
    defaultItems: [
      { name: 'Labor (per m²)', qty: 10, unit_price: 30 },
      { name: 'Tiles (if supplying)', qty: 1, unit_price: 0 },
      { name: 'Adhesive & grout', qty: 1, unit_price: 0 },
    ],
  },
  cleaning: {
    name: 'Cleaning Service', namePT: 'Limpeza',
    jobTypes: ['One-off domestic clean','Regular domestic clean','End of tenancy clean','Commercial office clean','After-build clean','Carpet cleaning','Oven clean'],
    defaultItems: [
      { name: 'Hours', qty: 3, unit_price: 25 },
      { name: 'Cleaning products', qty: 1, unit_price: 20 },
      { name: 'Travel', qty: 1, unit_price: 0 },
    ],
  },
  landscaper: {
    name: 'Landscaper', namePT: 'Jardinagem',
    jobTypes: ['Garden design','Lawn care & maintenance','Tree surgery/removal','Driveway & paving','Fencing','Artificial grass','Irrigation system','Maintenance contract'],
    defaultItems: [
      { name: 'Labor (day rate)', qty: 1, unit_price: 300 },
      { name: 'Plants & materials', qty: 1, unit_price: 0 },
      { name: 'Equipment hire', qty: 1, unit_price: 0 },
      { name: 'Waste disposal', qty: 1, unit_price: 0 },
    ],
  },
  handyman: {
    name: 'Handyman', namePT: 'Faz-tudo',
    jobTypes: ['Flat pack assembly','Multi-task visit (odd jobs)','TV mounting','Door/window repair','Shelving installation','Minor plumbing','Fence repair','General repairs'],
    defaultItems: [
      { name: 'Labor (hourly)', qty: 2, unit_price: 45 },
      { name: 'Parts/fixings', qty: 1, unit_price: 0 },
      { name: 'Travel', qty: 1, unit_price: 0 },
    ],
  },
  plasterer: {
    name: 'Plasterer', namePT: 'Estuqueiro',
    jobTypes: ['Full room plaster','Patch repair','Exterior rendering','Dry lining','Artex removal','Coving installation','Floor screeding'],
    defaultItems: [
      { name: 'Labor (day rate)', qty: 1, unit_price: 260 },
      { name: 'Plaster/render', qty: 1, unit_price: 0 },
      { name: 'Beading & accessories', qty: 1, unit_price: 0 },
    ],
  },
  flooring: {
    name: 'Flooring Specialist', namePT: 'Pavimentos',
    jobTypes: ['Hardwood installation','Laminate installation','Vinyl/LVT installation','Carpet fitting','Subfloor preparation','Sanding & refinishing'],
    defaultItems: [
      { name: 'Labor (per m²)', qty: 20, unit_price: 15 },
      { name: 'Flooring supply', qty: 1, unit_price: 0 },
      { name: 'Underlay', qty: 1, unit_price: 0 },
      { name: 'Trim/threshold strips', qty: 1, unit_price: 0 },
    ],
  },
  locksmith: {
    name: 'Locksmith', namePT: 'Serralheiro',
    jobTypes: ['Emergency lockout','Lock replacement','Lock upgrade','Key cutting','Safe opening','UPVC door repair'],
    defaultItems: [
      { name: 'Call-out fee', qty: 1, unit_price: 70 },
      { name: 'Labor', qty: 1, unit_price: 60 },
      { name: 'Lock unit', qty: 1, unit_price: 0 },
    ],
  },
  pestcontrol: {
    name: 'Pest Control', namePT: 'Controlo de Pragas',
    jobTypes: ['Rodent treatment','Wasp nest removal','Bed bug treatment','Cockroach treatment','Ant treatment','Pigeon proofing','Pest survey'],
    defaultItems: [
      { name: 'Call-out fee', qty: 1, unit_price: 80 },
      { name: 'Treatment (per visit)', qty: 1, unit_price: 120 },
      { name: 'Follow-up visit', qty: 1, unit_price: 80 },
    ],
  },
  glazier: {
    name: 'Glazier / Window Installer', namePT: 'Vidraceiro',
    jobTypes: ['Double glazing installation','Single pane replacement','Conservatory','Bi-fold doors','Composite front door','Patio doors','Misted unit replacement'],
    defaultItems: [
      { name: 'Labor', qty: 1, unit_price: 0 },
      { name: 'Unit supply', qty: 1, unit_price: 0 },
      { name: 'Disposal of old frames', qty: 1, unit_price: 50 },
    ],
  },
  solar: {
    name: 'Solar Panel Installer', namePT: 'Painéis Solares',
    jobTypes: ['Residential solar PV installation','Battery storage addition','EV charger + solar package','Annual service/clean','Inverter replacement'],
    defaultItems: [
      { name: 'Solar panels', qty: 8, unit_price: 250 },
      { name: 'Inverter', qty: 1, unit_price: 800 },
      { name: 'Battery storage', qty: 0, unit_price: 3000 },
      { name: 'Labor & commissioning', qty: 1, unit_price: 600 },
    ],
  },
  pool: {
    name: 'Pool & Hot Tub Maintenance', namePT: 'Piscinas',
    jobTypes: ['Weekly maintenance contract','Monthly maintenance contract','Equipment repair','Liner replacement','Pump & filter service','Seasonal opening/closing'],
    defaultItems: [
      { name: 'Labor', qty: 2, unit_price: 60 },
      { name: 'Chemicals', qty: 1, unit_price: 0 },
      { name: 'Parts', qty: 1, unit_price: 0 },
    ],
  },
  treesurgeon: {
    name: 'Tree Surgeon', namePT: 'Arboricultura',
    jobTypes: ['Tree removal','Crown reduction','Tree pruning','Stump grinding','Large hedge cutting','Emergency tree work'],
    defaultItems: [
      { name: 'Labor', qty: 1, unit_price: 0 },
      { name: 'Equipment hire', qty: 1, unit_price: 0 },
      { name: 'Waste disposal', qty: 1, unit_price: 0 },
    ],
  },
  fencing: {
    name: 'Fence & Gate Installer', namePT: 'Vedações',
    jobTypes: ['Timber fence installation','Metal railings','Composite fencing','Automated driveway gate','Manual driveway gate','Garden gate'],
    defaultItems: [
      { name: 'Labor', qty: 1, unit_price: 0 },
      { name: 'Panels/posts/concrete', qty: 1, unit_price: 0 },
      { name: 'Gate motor (if automated)', qty: 0, unit_price: 800 },
    ],
  },
  builder: {
    name: 'Builder / General Contractor', namePT: 'Construção Civil',
    jobTypes: ['Single storey extension','Double storey extension','Garage conversion','Loft conversion','Garden room','Structural alterations'],
    defaultItems: [
      { name: 'Labor', qty: 1, unit_price: 0 },
      { name: 'Materials', qty: 1, unit_price: 0 },
      { name: 'Plant hire', qty: 1, unit_price: 0 },
      { name: 'Skip hire', qty: 1, unit_price: 0 },
    ],
  },
  heating: {
    name: 'Heating Engineer', namePT: 'Aquecimento',
    jobTypes: ['Boiler installation','Boiler service','Boiler repair','Radiator installation','Underfloor heating','Power flush','Gas safety certificate'],
    defaultItems: [
      { name: 'Labor', qty: 1, unit_price: 0 },
      { name: 'Boiler unit', qty: 0, unit_price: 0 },
      { name: 'Parts', qty: 1, unit_price: 0 },
      { name: 'Commissioning', qty: 1, unit_price: 150 },
    ],
  },
  appliance: {
    name: 'Appliance Repair', namePT: 'Eletrodomésticos',
    jobTypes: ['Washing machine repair','Dishwasher repair','Oven/cooker repair','Fridge/freezer repair','Tumble dryer repair'],
    defaultItems: [
      { name: 'Call-out/diagnostic fee', qty: 1, unit_price: 60 },
      { name: 'Labor', qty: 1, unit_price: 60 },
      { name: 'Parts', qty: 1, unit_price: 0 },
    ],
  },
  security: {
    name: 'Alarm & Security', namePT: 'Segurança e Alarmes',
    jobTypes: ['Intruder alarm installation','CCTV installation','Smart lock/video doorbell','Fire alarm installation','Access control system','Annual service'],
    defaultItems: [
      { name: 'Equipment supply', qty: 1, unit_price: 0 },
      { name: 'Labor', qty: 1, unit_price: 0 },
      { name: 'Annual monitoring (optional)', qty: 0, unit_price: 120 },
    ],
  },
  garage: {
    name: 'Garage Door Specialist', namePT: 'Portões de Garagem',
    jobTypes: ['New garage door installation','Spring/mechanism repair','Motor/automation installation','Panel replacement','Door realignment'],
    defaultItems: [
      { name: 'Door unit', qty: 0, unit_price: 0 },
      { name: 'Motor & remote', qty: 0, unit_price: 0 },
      { name: 'Labor', qty: 1, unit_price: 0 },
    ],
  },
  damp: {
    name: 'Damp & Waterproofing', namePT: 'Impermeabilização',
    jobTypes: ['Damp survey','Rising damp treatment','Basement tanking','Condensation treatment','Cavity drainage','Crack injection'],
    defaultItems: [
      { name: 'Survey fee', qty: 1, unit_price: 150 },
      { name: 'Treatment materials', qty: 1, unit_price: 0 },
      { name: 'Labor', qty: 1, unit_price: 0 },
    ],
  },
  skip: {
    name: 'Skip Hire / Waste Removal', namePT: 'Remoção de Resíduos',
    jobTypes: ['Mini skip (2–4 yard)','Midi skip (6–8 yard)','Large skip (10–14 yard)','Grab lorry hire','Man & van clearance'],
    defaultItems: [
      { name: 'Skip hire', qty: 1, unit_price: 0 },
      { name: 'Delivery & collection', qty: 1, unit_price: 0 },
      { name: 'Permit (road placement)', qty: 0, unit_price: 60 },
    ],
  },
  kitchen_bathroom: {
    name: 'Kitchen & Bathroom Fitter', namePT: 'Cozinhas e Casas de Banho',
    jobTypes: ['Full kitchen installation','Kitchen worktop replacement','Full bathroom installation','Wet room conversion','En-suite installation'],
    defaultItems: [
      { name: 'Labor (day rate)', qty: 3, unit_price: 300 },
      { name: 'Plumbing connection', qty: 1, unit_price: 0 },
      { name: 'Electrical connection', qty: 1, unit_price: 0 },
    ],
  },
  scaffolding: {
    name: 'Scaffolding', namePT: 'Andaimes',
    jobTypes: ['Residential scaffold','Commercial scaffold','Birdcage scaffold','Chimney scaffold','Long-term hire'],
    defaultItems: [
      { name: 'Erection & strike labour', qty: 1, unit_price: 0 },
      { name: 'Scaffold hire (per week)', qty: 2, unit_price: 0 },
    ],
  },
  window_cleaner: {
    name: 'Window Cleaner', namePT: 'Lavagem de Vidros',
    jobTypes: ['External window clean','Internal & external clean','Conservatory clean','Gutter vacuum/clear','Commercial premises'],
    defaultItems: [
      { name: 'Per clean', qty: 1, unit_price: 60 },
      { name: 'Travel', qty: 1, unit_price: 0 },
    ],
  },
  law: {
    name: 'Boutique Law Firm', namePT: 'Advocacia',
    jobTypes: ['Initial consultation','Contract review','Company formation','Employment dispute','Conveyancing','Wills & probate'],
    defaultItems: [
      { name: 'Hours at rate', qty: 2, unit_price: 200 },
      { name: 'Disbursements', qty: 1, unit_price: 0 },
    ],
  },
  vet: {
    name: 'Veterinary Clinic', namePT: 'Clínica Veterinária',
    jobTypes: ['Wellness exam','Vaccination','Dental procedure','Surgery consultation','Emergency visit','X-ray/diagnostics','Neutering'],
    defaultItems: [
      { name: 'Consultation', qty: 1, unit_price: 60 },
      { name: 'Procedure', qty: 0, unit_price: 0 },
      { name: 'Medications', qty: 0, unit_price: 0 },
    ],
  },
  brewery: {
    name: 'Brewery (B2B)', namePT: 'Cervejaria (B2B)',
    jobTypes: ['Keg order','Cask order','Venue event package','Private label','Taproom hire'],
    defaultItems: [
      { name: 'Product (kegs/casks)', qty: 1, unit_price: 0 },
      { name: 'Delivery', qty: 1, unit_price: 0 },
      { name: 'Deposit', qty: 1, unit_price: 0 },
    ],
  },
}

export const TRADE_LIST = Object.entries(TRADES).map(([key, t]) => ({
  key, name: t.name, namePT: t.namePT,
})).sort((a, b) => a.name.localeCompare(b.name))

export const getTrade = (key) => TRADES[key] || null
export const getJobTypes = (key) => TRADES[key]?.jobTypes || []
export const getDefaultItems = (key) =>
  (TRADES[key]?.defaultItems || []).map((item, i) => ({
    ...item,
    id: `item-${i}-${Date.now()}`,
    total: (item.qty || 0) * (item.unit_price || 0),
  }))

export const formatCurrency = (amount, currency = 'EUR') =>
  new Intl.NumberFormat(currency === 'EUR' ? 'pt-PT' : 'en-US', {
    style: 'currency', currency,
    minimumFractionDigits: 2,
  }).format(amount || 0)
