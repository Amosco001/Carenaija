// Types
export type UserRole = "patient" | "employee" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type HospitalType = "Public" | "Private" | "Teaching" | "Specialist";

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

export type LoginCredentials = {
  email: string;
  password?: string;
};

export type RegisterCredentials = {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
};

// Seed Data - Lagos Hospitals
export const MOCK_HOSPITALS: Hospital[] = [
  {
    id: "luth",
    name: "Lagos University Teaching Hospital (LUTH)",
    state: "Lagos",
    city: "Idi-Araba",
    address: "Ishaga Rd, Idi-Araba, Lagos",
    website: "https://luth.gov.ng",
    phone: "+234 1 234 5678",
    type: "Teaching",
    description: "One of the largest teaching hospitals in Nigeria, affiliated with the University of Lagos College of Medicine.",
    images: ["https://images.unsplash.com/photo-1587351021759-3e566b9af953?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Teaching", "Public", "Referral", "Emergency"],
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
    description: "The teaching hospital for Lagos State University, known for its busy clinics and specialist services.",
    images: ["https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Teaching", "Public", "Surgery"],
    ratingPatient: 3.4,
    ratingEmployee: 3.3,
    reviewCountPatient: 98,
    reviewCountEmployee: 30
  },
  {
    id: "lagoon-vi",
    name: "Lagoon Hospitals (Victoria Island)",
    state: "Lagos",
    city: "Victoria Island",
    address: "17B Bishop Aboyade Cole St, Victoria Island, Lagos",
    website: "https://www.lagoonhospitals.com",
    type: "Private",
    description: "Part of the Lagoon Hospitals group, offering premium private healthcare services in VI.",
    images: ["https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Luxury", "Specialist"],
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
    tags: ["Private", "General Care"],
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
    description: "A leading multi-specialist hospital in Nigeria, located in the heart of Lagos Island.",
    images: ["https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Nephrology", "Surgery"],
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
    description: "A premium private healthcare provider offering international standard medical services.",
    images: ["https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Maternity", "Cardiology", "Luxury Care"],
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
    description: "A well-known private hospital group listed on the Nigerian Stock Exchange.",
    images: ["https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "General Care"],
    ratingPatient: 3.6,
    ratingEmployee: 3.4,
    reviewCountPatient: 55,
    reviewCountEmployee: 20
  },
  {
    id: "eko-vi",
    name: "Eko Hospital (Victoria Island)",
    state: "Lagos",
    city: "Victoria Island",
    address: "Kofo Abayomi St, Victoria Island, Lagos",
    website: "https://ekohospitals.com",
    type: "Private",
    description: "Victoria Island branch of the Eko Hospital group.",
    images: ["https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Clinic"],
    ratingPatient: 3.8,
    ratingEmployee: 3.5,
    reviewCountPatient: 25,
    reviewCountEmployee: 8
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
    tags: ["Infectious Diseases", "General Care"],
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
    description: "A modern, luxury private hospital in Ikeja GRA focusing on premium patient experience.",
    images: ["https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Luxury", "Private", "International"],
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
    description: "A major general hospital serving the mainland population, with various specialist units.",
    images: ["https://images.unsplash.com/photo-1587351021759-3e566b9af953?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Public", "General Care", "Dialysis"],
    ratingPatient: 3.0,
    ratingEmployee: 3.1,
    reviewCountPatient: 110,
    reviewCountEmployee: 35
  },
  {
    id: "lagos-island-gen",
    name: "Lagos Island General Hospital",
    state: "Lagos",
    city: "Lagos Island",
    address: "Broad St, Lagos Island, Lagos",
    type: "Public",
    description: "One of the oldest hospitals in Lagos, providing general medical services to the island population.",
    images: ["https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Public", "General Care", "Historic"],
    ratingPatient: 2.9,
    ratingEmployee: 2.8,
    reviewCountPatient: 85,
    reviewCountEmployee: 25
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
    tags: ["Public", "Federal", "Affordable"],
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
    description: "A specialist pediatric hospital dedicated to the care of children.",
    images: ["https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Pediatrics", "Children", "Public"],
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
    tags: ["Private", "Boutique", "Family Medicine"],
    ratingPatient: 4.4,
    ratingEmployee: 4.1,
    reviewCountPatient: 40,
    reviewCountEmployee: 15
  },
  {
    id: "afrimed",
    name: "Afrimed Specialist Hospital",
    state: "Lagos",
    city: "Gbagada",
    address: "Gbagada, Lagos",
    type: "Private",
    description: "A specialist private hospital serving the Gbagada and mainland environs.",
    images: ["https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Specialist"],
    ratingPatient: 3.7,
    ratingEmployee: 3.5,
    reviewCountPatient: 28,
    reviewCountEmployee: 8
  },
  {
    id: "healing-stripes",
    name: "Healing Stripes Hospital",
    state: "Lagos",
    city: "Victoria Island",
    address: "Victoria Island, Lagos",
    website: "https://healingstripeshospital.com",
    type: "Private",
    description: "A private medical facility offering a range of diagnostic and therapeutic services.",
    images: ["https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Diagnostics"],
    ratingPatient: 3.9,
    ratingEmployee: 3.6,
    reviewCountPatient: 35,
    reviewCountEmployee: 10
  }
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
  }
];

// Helper functions to simulate DB
export const getHospital = (id: string) => MOCK_HOSPITALS.find(h => h.id === id);
export const getPatientReviews = (hospitalId: string) => MOCK_PATIENT_REVIEWS.filter(r => r.hospitalId === hospitalId && r.isVisible);
export const getEmployeeReviews = (hospitalId: string) => MOCK_EMPLOYEE_REVIEWS.filter(r => r.hospitalId === hospitalId && r.isVisible);
