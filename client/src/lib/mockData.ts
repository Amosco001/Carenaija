// Types
export type UserRole = "patient" | "employee" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type HospitalType = "Public" | "Private" | "Teaching" | "Specialist" | "Federal";

export type Hospital = {
  id: string;
  name: string;
  state: string;
  city: string;
  address: string;
  website?: string;
  phone?: string;
  type: HospitalType;
  description: string;
  images: string[];
  tags: string[]; // derived tags like "Good for Maternity"
  ratingPatient: number;
  ratingEmployee: number;
  reviewCountPatient: number;
  reviewCountEmployee: number;
};

export type PatientReview = {
  id: string;
  hospitalId: string;
  userId: string;
  userName: string; // denormalized for mock
  rating: number;
  title: string;
  comment: string;
  tags: string[];
  date: string;
  isVisible: boolean;
};

export type EmployeeReview = {
  id: string;
  hospitalId: string;
  userId: string;
  jobTitle: string;
  salaryMin: number;
  salaryMax: number;
  rating: number; // overall
  pros: string;
  cons: string;
  recommends: boolean;
  isVisible: boolean;
  date: string;
};

// Seed Data - Lagos Hospitals
const LAGOS_HOSPITALS: Hospital[] = [
  {
    id: "luth",
    name: "Lagos University Teaching Hospital (LUTH)",
    state: "Lagos",
    city: "Idi-Araba",
    address: "Ishaga Rd, Idi-Araba, Lagos",
    website: "https://luth.gov.ng",
    phone: "+234 1 234 5678",
    type: "Teaching",
    description: "One of the largest teaching hospitals in Nigeria, affiliated with the University of Lagos College of Medicine. Known for comprehensive tertiary care.",
    images: ["https://images.unsplash.com/photo-1587351021759-3e566b9af953?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Teaching", "Public", "Referral", "Emergency", "Oncology", "Dentistry"],
    ratingPatient: 3.2,
    ratingEmployee: 3.5,
    reviewCountPatient: 124,
    reviewCountEmployee: 45
  },
  {
    id: "lasuth",
    name: "Lagos State University Teaching Hospital (LASUTH)",
    state: "Lagos",
    city: "Ikeja",
    address: "1-5 Oba Akinjobi Way, Ikeja, Lagos",
    website: "https://lasuth.org.ng",
    phone: "+234 1 234 1234",
    type: "Teaching",
    description: "The teaching hospital for Lagos State University, known for its busy clinics and specialist services including a Critical Care Unit.",
    images: ["https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Teaching", "Public", "Surgery", "Critical Care", "Pediatrics"],
    ratingPatient: 3.4,
    ratingEmployee: 3.3,
    reviewCountPatient: 98,
    reviewCountEmployee: 30
  },
  {
    id: "evercare",
    name: "Evercare Hospital Lekki",
    state: "Lagos",
    city: "Lekki",
    address: "Bisola Durosinmi Etti Dr, Lekki Phase 1, Lagos",
    website: "https://evercare.ng",
    type: "Private",
    description: "A 165-bed multispecialty tertiary care facility offering international standards of healthcare.",
    images: ["https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "International", "Multispecialty", "Cardiology", "Neurology"],
    ratingPatient: 4.6,
    ratingEmployee: 4.3,
    reviewCountPatient: 52,
    reviewCountEmployee: 18
  },
  {
    id: "lagoon-vi",
    name: "Lagoon Hospitals (Victoria Island)",
    state: "Lagos",
    city: "Victoria Island",
    address: "17B Bishop Aboyade Cole St, Victoria Island, Lagos",
    website: "https://www.lagoonhospitals.com",
    type: "Private",
    description: "Part of the Lagoon Hospitals group, offering premium private healthcare services in VI. First JCI accredited hospital in Nigeria.",
    images: ["https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Luxury", "Specialist", "Orthopedics", "Trauma"],
    ratingPatient: 4.1,
    ratingEmployee: 3.8,
    reviewCountPatient: 45,
    reviewCountEmployee: 12
  },
  {
    id: "lagoon-ikeja",
    name: "Lagoon Hospitals (Ikeja)",
    state: "Lagos",
    city: "Ikeja",
    address: "Obafemi Awolowo Way, Ikeja, Lagos",
    website: "https://www.lagoonhospitals.com",
    type: "Private",
    description: "The Ikeja branch of Lagoon Hospitals, providing comprehensive medical care on the mainland.",
    images: ["https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "General Care", "Surgery"],
    ratingPatient: 4.0,
    ratingEmployee: 3.7,
    reviewCountPatient: 32,
    reviewCountEmployee: 10
  },
  {
    id: "st-nicholas",
    name: "St. Nicholas Hospital",
    state: "Lagos",
    city: "Lagos Island",
    address: "57 Campbell St, Lagos Island, Lagos",
    website: "https://saintnicholashospital.com",
    type: "Private",
    description: "A leading multi-specialist hospital in Nigeria, renowned for performing the first kidney transplant in Nigeria.",
    images: ["https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Nephrology", "Surgery", "Transplant", "Oncology"],
    ratingPatient: 4.3,
    ratingEmployee: 4.0,
    reviewCountPatient: 60,
    reviewCountEmployee: 18
  },
  {
    id: "reddington-vi",
    name: "Reddington Hospital",
    state: "Lagos",
    city: "Victoria Island",
    address: "39 Idowu Martins St, Victoria Island, Lagos",
    website: "https://reddingtonhospital.com",
    phone: "+234 1 271 5341",
    type: "Private",
    description: "A premium private healthcare provider offering international standard medical services including a specialized cardiac centre.",
    images: ["https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Maternity", "Cardiology", "Luxury Care", "Gastroenterology"],
    ratingPatient: 4.5,
    ratingEmployee: 4.0,
    reviewCountPatient: 89,
    reviewCountEmployee: 22
  },
  {
    id: "eko-ikeja",
    name: "Eko Hospital (Ikeja)",
    state: "Lagos",
    city: "Ikeja",
    address: "Mobolaji Bank Anthony Way, Ikeja, Lagos",
    website: "https://ekohospitals.com",
    type: "Private",
    description: "A well-known private hospital group listed on the Nigerian Stock Exchange. Comprehensive specialist services.",
    images: ["https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "General Care", "Radiotherapy", "Pediatrics"],
    ratingPatient: 3.6,
    ratingEmployee: 3.4,
    reviewCountPatient: 55,
    reviewCountEmployee: 20
  },
  {
    id: "first-consultants",
    name: "First Consultants Medical Centre",
    state: "Lagos",
    city: "Obalende",
    address: "St. Gregory's College Road, Obalende, Lagos",
    type: "Private",
    description: "Renowned for its role in containing the Ebola outbreak, offering high-standard general and specialist care.",
    images: ["https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Infectious Diseases", "General Care", "Gynecology"],
    ratingPatient: 4.2,
    ratingEmployee: 3.9,
    reviewCountPatient: 56,
    reviewCountEmployee: 15
  },
  {
    id: "duchess",
    name: "Duchess International Hospital",
    state: "Lagos",
    city: "Ikeja",
    address: "22A Joel Ogunnaike St, Ikeja GRA, Lagos",
    website: "https://duchesshospital.com",
    type: "Private",
    description: "A modern, luxury private hospital in Ikeja GRA focusing on premium patient experience and advanced surgery.",
    images: ["https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Luxury", "Private", "International", "Cardiology", "Orthopedics"],
    ratingPatient: 4.7,
    ratingEmployee: 4.2,
    reviewCountPatient: 30,
    reviewCountEmployee: 10
  },
  {
    id: "gbagada-gen",
    name: "Gbagada General Hospital",
    state: "Lagos",
    city: "Gbagada",
    address: "Hospital Rd, Gbagada, Lagos",
    type: "Public",
    description: "A major general hospital serving the mainland population, with various specialist units including a cardiac and renal centre.",
    images: ["https://images.unsplash.com/photo-1587351021759-3e566b9af953?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Public", "General Care", "Dialysis", "Cardiac"],
    ratingPatient: 3.0,
    ratingEmployee: 3.1,
    reviewCountPatient: 110,
    reviewCountEmployee: 35
  },
  {
    id: "fmc-ebute-metta",
    name: "Federal Medical Centre Ebute-Metta",
    state: "Lagos",
    city: "Ebute-Metta",
    address: "Railway Compound, Ebute-Metta, Lagos",
    type: "Public",
    description: "A federal government owned medical centre known for more affordable specialist care.",
    images: ["https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Public", "Federal", "Affordable", "Psychiatry", "General Surgery"],
    ratingPatient: 3.3,
    ratingEmployee: 3.2,
    reviewCountPatient: 95,
    reviewCountEmployee: 28
  },
  {
    id: "massey-children",
    name: "Massey Street Children’s Hospital",
    state: "Lagos",
    city: "Lagos Island",
    address: "Massey St, Lagos Island, Lagos",
    type: "Public",
    description: "A specialist pediatric hospital dedicated to the care of children. One of the oldest in the country.",
    images: ["https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Pediatrics", "Children", "Public", "Neonatology"],
    ratingPatient: 3.5,
    ratingEmployee: 3.0,
    reviewCountPatient: 70,
    reviewCountEmployee: 20
  },
  {
    id: "paelon",
    name: "Paelon Memorial Hospital",
    state: "Lagos",
    city: "Ikeja",
    address: "9 Ajao Rd, Ikeja, Lagos",
    website: "https://paelonmemorial.com",
    type: "Private",
    description: "A boutique private hospital known for personalized care and evidence-based medicine.",
    images: ["https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Boutique", "Family Medicine", "Geriatrics"],
    ratingPatient: 4.4,
    ratingEmployee: 4.1,
    reviewCountPatient: 40,
    reviewCountEmployee: 15
  }
];

const ABUJA_HOSPITALS: Hospital[] = [
  {
    id: "national-hospital-abuja",
    name: "National Hospital Abuja",
    state: "FCT",
    city: "Abuja",
    address: "265 Independence Ave, Central Business Dis, Abuja",
    phone: "+234 9 234 1234",
    type: "Federal",
    description: "A major referral centre designed to cater for the needs of women and children in Nigeria and the West African sub-region.",
    images: ["https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Public", "Federal", "Tertiary", "Referral", "Oncology", "Trauma"],
    ratingPatient: 3.8,
    ratingEmployee: 3.2,
    reviewCountPatient: 210,
    reviewCountEmployee: 67
  },
  {
    id: "nisa-premier",
    name: "Nisa Premier Hospital",
    state: "FCT",
    city: "Abuja",
    address: "15/21 Alex Ekwueme Way, Jabi, Abuja",
    website: "https://nisa.com.ng",
    type: "Private",
    description: "One of the most prestigious private hospitals in Abuja, known for fertility services and maternity care.",
    images: ["https://images.unsplash.com/photo-1587351021759-3e566b9af953?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Fertility", "Maternity", "IVF", "Pediatrics"],
    ratingPatient: 4.5,
    ratingEmployee: 4.1,
    reviewCountPatient: 150,
    reviewCountEmployee: 40
  },
  {
    id: "cedarcrest-abuja",
    name: "Cedarcrest Hospitals",
    state: "FCT",
    city: "Abuja",
    address: "2 Sam Mbakwe St, Apo, Abuja",
    website: "https://cedarcresthospitals.com",
    type: "Private",
    description: "A modern specialist hospital known for orthopedics, trauma care, and surgical services. FIFA accredited medical centre.",
    images: ["https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Orthopedics", "Trauma", "Sports Medicine", "Surgery"],
    ratingPatient: 4.4,
    ratingEmployee: 4.0,
    reviewCountPatient: 95,
    reviewCountEmployee: 30
  },
  {
    id: "nizamiye",
    name: "Nizamiye Hospital",
    state: "FCT",
    city: "Abuja",
    address: "Plot 113, Cadastral Zone, Life Camp, Abuja",
    website: "https://nizamiye.ng",
    type: "Private",
    description: "A world-class medical facility established by the Nigerian-Turkish Nile University, known for excellent facilities and cardiac care.",
    images: ["https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "International", "Luxury", "Cardiology", "Urology"],
    ratingPatient: 4.8,
    ratingEmployee: 4.5,
    reviewCountPatient: 120,
    reviewCountEmployee: 45
  },
  {
    id: "kelina-hospital",
    name: "Kelina Hospital",
    state: "FCT",
    city: "Abuja",
    address: "3rd Avenue, Gwarinpa, Abuja",
    website: "https://kelinahospital.com",
    type: "Specialist",
    description: "Specialized in Minimally Invasive Surgery, Laser Lithotripsy for Kidney Stones, and advanced surgical procedures.",
    images: ["https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Specialist", "Surgery", "Urology", "Laser Surgery"],
    ratingPatient: 4.6,
    ratingEmployee: 4.2,
    reviewCountPatient: 40,
    reviewCountEmployee: 15
  }
];

const PH_HOSPITALS: Hospital[] = [
  {
    id: "upth",
    name: "University of Port Harcourt Teaching Hospital",
    state: "Rivers",
    city: "Port Harcourt",
    address: "East-West Rd, Alakahia, Port Harcourt",
    type: "Teaching",
    description: "A major tertiary health institution in the Niger Delta region, providing specialized medical services.",
    images: ["https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Teaching", "Public", "Tertiary", "Referral", "Burn Unit"],
    ratingPatient: 3.1,
    ratingEmployee: 3.0,
    reviewCountPatient: 180,
    reviewCountEmployee: 60
  },
  {
    id: "meridian",
    name: "Meridian Hospitals",
    state: "Rivers",
    city: "Port Harcourt",
    address: "21 Igbodo St, Old GRA, Port Harcourt",
    website: "https://meridianhospitals.net",
    type: "Private",
    description: "A leading private hospital in Port Harcourt known for quality care and modern facilities.",
    images: ["https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "General Care", "Surgery", "Eye Care"],
    ratingPatient: 4.0,
    ratingEmployee: 3.7,
    reviewCountPatient: 65,
    reviewCountEmployee: 20
  }
];

const OYO_HOSPITALS: Hospital[] = [
  {
    id: "uch-ibadan",
    name: "University College Hospital (UCH)",
    state: "Oyo",
    city: "Ibadan",
    address: "Queen Elizabeth Road, Agodi, Ibadan",
    website: "https://uch-ibadan.org.ng",
    type: "Teaching",
    description: "The first teaching hospital in Nigeria. A premier tertiary institution known for training, research, and specialized care.",
    images: ["https://images.unsplash.com/photo-1587351021759-3e566b9af953?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Teaching", "Public", "Federal", "Neurosurgery", "Cardiology", "Nuclear Medicine"],
    ratingPatient: 3.5,
    ratingEmployee: 3.6,
    reviewCountPatient: 250,
    reviewCountEmployee: 110
  },
  {
    id: "molly-specialist",
    name: "Molly Specialist Hospital",
    state: "Oyo",
    city: "Ibadan",
    address: "Queen Elizabeth II Road, Agodi, Ibadan",
    website: "https://www.mollyspecialisthospital.com",
    type: "Private",
    description: "A reputable private specialist hospital in Ibadan providing multi-specialty care.",
    images: ["https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Specialist", "General Care"],
    ratingPatient: 3.9,
    ratingEmployee: 3.8,
    reviewCountPatient: 45,
    reviewCountEmployee: 15
  },
  {
    id: "best-western-ibadan",
    name: "Best Western Hospital",
    state: "Oyo",
    city: "Ibadan",
    address: "2 Oyebaniji Street, Winners Way, off Bashorun Market, Ibadan",
    type: "Private",
    description: "Highly rated private hospital in Ibadan with modern diagnostic equipment.",
    images: ["https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Diagnostics", "Maternity", "Surgery"],
    ratingPatient: 4.2,
    ratingEmployee: 3.9,
    reviewCountPatient: 30,
    reviewCountEmployee: 10
  }
];

const KANO_HOSPITALS: Hospital[] = [
  {
    id: "aminu-kano-teaching",
    name: "Aminu Kano Teaching Hospital (AKTH)",
    state: "Kano",
    city: "Kano",
    address: "1 Zaria Road, Unguwa Uku, Kano",
    website: "https://akth.gov.ng",
    type: "Teaching",
    description: "A federal teaching hospital serving as a major referral center for Northern Nigeria. Known for kidney transplant services.",
    images: ["https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Teaching", "Public", "Referral", "Nephrology", "Transplant"],
    ratingPatient: 3.4,
    ratingEmployee: 3.5,
    reviewCountPatient: 190,
    reviewCountEmployee: 85
  },
  {
    id: "national-orthopaedic-dala",
    name: "National Orthopaedic Hospital Dala",
    state: "Kano",
    city: "Dala",
    address: "Kofar Dawanau Road, Dala, Kano",
    type: "Federal",
    description: "A specialist federal hospital dedicated to orthopedics and trauma care.",
    images: ["https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Federal", "Specialist", "Orthopedics", "Trauma"],
    ratingPatient: 3.7,
    ratingEmployee: 3.4,
    reviewCountPatient: 75,
    reviewCountEmployee: 25
  },
  {
    id: "makkah-eye",
    name: "Makkah Specialist Eye Hospital",
    state: "Kano",
    city: "Kano",
    address: "No. 5/12 NNDC Quarters, BUK Road, Kano",
    type: "Specialist",
    description: "A specialized eye care centre providing comprehensive ophthalmology services.",
    images: ["https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Specialist", "Eye Care", "Ophthalmology", "Private"],
    ratingPatient: 4.3,
    ratingEmployee: 4.0,
    reviewCountPatient: 60,
    reviewCountEmployee: 15
  }
];

const ENUGU_HOSPITALS: Hospital[] = [
  {
    id: "unth-enugu",
    name: "University of Nigeria Teaching Hospital (UNTH)",
    state: "Enugu",
    city: "Enugu",
    address: "Ituku-Ozalla, Enugu",
    website: "https://unth.edu.ng",
    type: "Teaching",
    description: "A major teaching hospital in South-East Nigeria, known for open-heart surgery and specialized care.",
    images: ["https://images.unsplash.com/photo-1587351021759-3e566b9af953?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Teaching", "Public", "Cardiothoracic", "Surgery"],
    ratingPatient: 3.2,
    ratingEmployee: 3.3,
    reviewCountPatient: 140,
    reviewCountEmployee: 50
  },
  {
    id: "memfys",
    name: "Memfys Hospital for Neurosurgery",
    state: "Enugu",
    city: "Enugu",
    address: "Km 2 Enugu-Onitsha Expressway, Trans-Ekulu, Enugu",
    website: "https://memfys.net",
    type: "Specialist",
    description: "A private specialist hospital dedicated to Neurosurgery, Neurology, and Critical Care.",
    images: ["https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Specialist", "Neurosurgery", "Neurology"],
    ratingPatient: 4.5,
    ratingEmployee: 4.2,
    reviewCountPatient: 55,
    reviewCountEmployee: 20
  },
  {
    id: "national-orthopaedic-enugu",
    name: "National Orthopaedic Hospital Enugu",
    state: "Enugu",
    city: "Enugu",
    address: "Enugu",
    website: "https://nohenugu.org.ng",
    type: "Federal",
    description: "A regional centre for orthopedics, burns, and plastic surgery.",
    images: ["https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Federal", "Specialist", "Orthopedics", "Burns", "Plastic Surgery"],
    ratingPatient: 3.6,
    ratingEmployee: 3.5,
    reviewCountPatient: 80,
    reviewCountEmployee: 30
  }
];

const KADUNA_HOSPITALS: Hospital[] = [
  {
    id: "abuth",
    name: "Ahmadu Bello University Teaching Hospital (ABUTH)",
    state: "Kaduna",
    city: "Zaria",
    address: "Shika, Zaria",
    type: "Teaching",
    description: "The premier teaching hospital for Northern Nigeria, offering comprehensive medical training and specialized care.",
    images: ["https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Teaching", "Public", "Referral", "Research"],
    ratingPatient: 3.3,
    ratingEmployee: 3.4,
    reviewCountPatient: 160,
    reviewCountEmployee: 70
  },
  {
    id: "ashmed",
    name: "Ashmed Specialist Hospital",
    state: "Kaduna",
    city: "Kaduna",
    address: "Kaduna",
    website: "https://ashmedspecialisthospital.com",
    type: "Private",
    description: "An ultra-modern multi-specialty private hospital with branches across the region.",
    images: ["https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Multi-specialty", "Cardiology", "Pediatrics"],
    ratingPatient: 4.1,
    ratingEmployee: 3.9,
    reviewCountPatient: 45,
    reviewCountEmployee: 15
  },
  {
    id: "44-army",
    name: "44 Nigerian Army Reference Hospital",
    state: "Kaduna",
    city: "Kaduna",
    address: "Sokoto Road, Kaduna",
    type: "Federal",
    description: "A major military reference hospital providing general and specialist medical services.",
    images: ["https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Federal", "Military", "General Care", "Trauma"],
    ratingPatient: 3.5,
    ratingEmployee: 3.6,
    reviewCountPatient: 60,
    reviewCountEmployee: 25
  }
];

export const MOCK_HOSPITALS: Hospital[] = [
  ...LAGOS_HOSPITALS,
  ...ABUJA_HOSPITALS,
  ...PH_HOSPITALS,
  ...OYO_HOSPITALS,
  ...KANO_HOSPITALS,
  ...ENUGU_HOSPITALS,
  ...KADUNA_HOSPITALS
];

// Keep existing reviews for demo purposes, mapped to new IDs where possible
export const MOCK_PATIENT_REVIEWS: PatientReview[] = [
  {
    id: "101",
    hospitalId: "reddington-vi",
    userId: "u1",
    userName: "Nneka A.",
    rating: 5,
    title: "Excellent maternity experience",
    comment: "The nurses were incredibly attentive during my delivery. The facilities are top-notch and clean. Highly recommended for expectant mothers.",
    tags: ["Maternity", "Cleanliness"],
    date: "2023-11-15",
    isVisible: true
  },
  {
    id: "102",
    hospitalId: "luth",
    userId: "u2",
    userName: "Tunde B.",
    rating: 2,
    title: "Long wait times",
    comment: "I waited for 4 hours to see a doctor at the emergency ward. The doctors are good but the system is overwhelmed.",
    tags: ["Emergency", "Wait Times"],
    date: "2023-10-20",
    isVisible: true
  },
  {
    id: "103",
    hospitalId: "lagoon-vi",
    userId: "u3",
    userName: "Musa K.",
    rating: 4,
    title: "Good care but expensive",
    comment: "Quality of care is comparable to private hospitals abroad, but the billing process is opaque.",
    tags: ["Billing", "Quality"],
    date: "2023-12-05",
    isVisible: true
  },
  {
    id: "104",
    hospitalId: "nisa-premier",
    userId: "u4",
    userName: "Amina Y.",
    rating: 5,
    title: "Best IVF center in Abuja",
    comment: "We had a successful IVF cycle here after trying for years. The doctors are professional and empathetic.",
    tags: ["Fertility", "IVF"],
    date: "2024-01-10",
    isVisible: true
  },
  {
    id: "105",
    hospitalId: "nizamiye",
    userId: "u5",
    userName: "David O.",
    rating: 5,
    title: "World class facilities",
    comment: "Feels like a hotel, not a hospital. Extremely clean and the staff are very polite. Expensive but worth it.",
    tags: ["Facilities", "Cleanliness"],
    date: "2024-02-15",
    isVisible: true
  },
  {
    id: "106",
    hospitalId: "uch-ibadan",
    userId: "u6",
    userName: "Funke A.",
    rating: 4,
    title: "Excellent specialists",
    comment: "The consultants are the best in the country, but the facilities need upgrade. If you want expertise, this is the place.",
    tags: ["Specialist", "Expertise"],
    date: "2024-01-05",
    isVisible: true
  },
  {
    id: "107",
    hospitalId: "aminu-kano-teaching",
    userId: "u7",
    userName: "Ibrahim M.",
    rating: 3,
    title: "Crowded but good doctors",
    comment: "Very crowded clinics. You have to come very early. But the doctors know their work very well.",
    tags: ["Wait Times", "Expertise"],
    date: "2023-12-10",
    isVisible: true
  }
];

export const MOCK_EMPLOYEE_REVIEWS: EmployeeReview[] = [
  {
    id: "201",
    hospitalId: "luth",
    userId: "e1",
    jobTitle: "Senior Registrar",
    salaryMin: 250000,
    salaryMax: 350000,
    rating: 3,
    pros: "Great exposure to diverse cases. Good for learning and career growth.",
    cons: "Workload is extreme. Often short-staffed and equipment breakdowns are common.",
    recommends: true,
    isVisible: true,
    date: "2023-09-10"
  },
  {
    id: "202",
    hospitalId: "reddington-vi",
    userId: "e2",
    jobTitle: "Nurse",
    salaryMin: 150000,
    salaryMax: 200000,
    rating: 4,
    pros: "Clean environment, salary is paid on time, respectful management.",
    cons: "Strict policies and long shifts without enough breaks.",
    recommends: true,
    isVisible: true,
    date: "2023-11-22"
  },
  {
    id: "203",
    hospitalId: "cedarcrest-abuja",
    userId: "e3",
    jobTitle: "Medical Officer",
    salaryMin: 300000,
    salaryMax: 450000,
    rating: 4,
    pros: "Professional environment, access to modern equipment.",
    cons: "High patient volume can be stressful.",
    recommends: true,
    isVisible: true,
    date: "2024-01-20"
  },
  {
    id: "204",
    hospitalId: "uch-ibadan",
    userId: "e4",
    jobTitle: "Resident Doctor",
    salaryMin: 200000,
    salaryMax: 300000,
    rating: 3,
    pros: "Best place for residency training. You see everything.",
    cons: "Facilities are aging. Sometimes strikes affect work.",
    recommends: true,
    isVisible: true,
    date: "2023-11-05"
  }
];

// Helper functions to simulate DB
export const getHospital = (id: string) => MOCK_HOSPITALS.find(h => h.id === id);
export const getPatientReviews = (hospitalId: string) => MOCK_PATIENT_REVIEWS.filter(r => r.hospitalId === hospitalId && r.isVisible);
export const getEmployeeReviews = (hospitalId: string) => MOCK_EMPLOYEE_REVIEWS.filter(r => r.hospitalId === hospitalId && r.isVisible);
