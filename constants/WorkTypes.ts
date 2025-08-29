export interface WorkType {
  id: string;
  name: string;
  description: string;
  category: WorkCategory;
  priority: number; // Lower numbers = higher priority for MVP
}

export type WorkCategory = 'construction' | 'utilities' | 'repairs' | 'outdoor';

export const WORK_CATEGORIES = {
  construction: 'Home Construction & Renovation',
  utilities: 'Utilities & Technical Services', 
  repairs: 'Repairs & Emergency Services',
  outdoor: 'Outdoor & Garden'
} as const;

export const WORK_TYPES: WorkType[] = [
  // MVP Priority (Top 5 most in-demand)
  {
    id: 'plumbing',
    name: 'Plumbing (Sanitary Work)',
    description: 'Water pipes, bathrooms, kitchens, leak repair',
    category: 'utilities',
    priority: 1
  },
  {
    id: 'electrical',
    name: 'Electrical Work',
    description: 'Sockets, lighting, wiring, smart home systems',
    category: 'utilities',
    priority: 2
  },
  {
    id: 'heating_hvac',
    name: 'Heating & HVAC',
    description: 'Heating systems, heat pumps, air conditioning, ventilation',
    category: 'utilities',
    priority: 3
  },
  {
    id: 'carpentry',
    name: 'Carpentry & Joinery',
    description: 'Furniture, woodwork, interior fittings, assembly',
    category: 'construction',
    priority: 4
  },
  {
    id: 'painting',
    name: 'Painting & Decorating',
    description: 'Painting walls, wallpapering, surface finishing',
    category: 'construction',
    priority: 5
  },

  // Additional Services
  {
    id: 'masonry',
    name: 'Masonry',
    description: 'Brickwork, concrete, drywall, structural repairs',
    category: 'construction',
    priority: 6
  },
  {
    id: 'flooring',
    name: 'Flooring & Tiling',
    description: 'Parquet, laminate, carpets, ceramic or stone tiling',
    category: 'construction',
    priority: 7
  },
  {
    id: 'roofing',
    name: 'Roofing',
    description: 'Roof installation, repair, insulation, skylights',
    category: 'construction',
    priority: 8
  },
  {
    id: 'plastering',
    name: 'Plastering',
    description: 'Plaster, stucco, facade finishing',
    category: 'construction',
    priority: 9
  },
  {
    id: 'solar',
    name: 'Solar Installation',
    description: 'Photovoltaic panels, solar thermal systems',
    category: 'utilities',
    priority: 10
  },
  {
    id: 'handyman',
    name: 'General Repairs / Handyman Services',
    description: 'Small jobs, assembly, minor fixes',
    category: 'repairs',
    priority: 11
  },
  {
    id: 'locksmith',
    name: 'Locksmith',
    description: 'Locks, keys, door opening',
    category: 'repairs',
    priority: 12
  },
  {
    id: 'glazier',
    name: 'Glazier',
    description: 'Windows, glass doors, glazing repairs',
    category: 'repairs',
    priority: 13
  },
  {
    id: 'appliance_repair',
    name: 'Appliance Repair',
    description: 'Washing machines, dishwashers, refrigerators',
    category: 'repairs',
    priority: 14
  },
  {
    id: 'metalwork',
    name: 'Metalwork / Welding',
    description: 'Small repairs, custom fittings, welding services',
    category: 'repairs',
    priority: 15
  },
  {
    id: 'gardening',
    name: 'Gardening & Landscaping',
    description: 'Lawn care, planting, tree cutting, garden design',
    category: 'outdoor',
    priority: 16
  },
  {
    id: 'paving',
    name: 'Paving & Outdoor Construction',
    description: 'Terraces, driveways, stonework',
    category: 'outdoor',
    priority: 17
  },
  {
    id: 'fencing',
    name: 'Fencing & Gates',
    description: 'Wooden or metal fences, privacy screens, gates',
    category: 'outdoor',
    priority: 18
  }
];

// Get MVP work types (priority 1-5)
export const MVP_WORK_TYPES = WORK_TYPES.filter(type => type.priority <= 5).sort((a, b) => a.priority - b.priority);

// Get work types by category
export const getWorkTypesByCategory = (category: WorkCategory): WorkType[] => {
  return WORK_TYPES.filter(type => type.category === category).sort((a, b) => a.priority - b.priority);
};

// Get MVP badge for high priority work types
export const isMVPWorkType = (workTypeId: string): boolean => {
  const workType = WORK_TYPES.find(type => type.id === workTypeId);
  return workType ? workType.priority <= 5 : false;
};