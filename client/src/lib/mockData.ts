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
  phone: string;
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

// Seed Data
export const MOCK_HOSPITALS: Hospital[] = [
  {
    id: "1",
    name: "Lagos University Teaching Hospital (LUTH)",
    state: "Lagos",
    city: "Idi-Araba",
    address: "Ishaga Rd, Idi-Araba, Lagos",
    website: "https://luth.gov.ng",
    phone: "+234 1 234 5678",
    type: "Teaching",
    description: "One of the largest teaching hospitals in Nigeria, known for its comprehensive specialist services and medical research.",
    images: ["https://images.unsplash.com/photo-1587351021759-3e566b9af953?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Emergency", "Surgery", "Research"],
    ratingPatient: 3.2,
    ratingEmployee: 3.5,
    reviewCountPatient: 124,
    reviewCountEmployee: 45
  },
  {
    id: "2",
    name: "Reddington Hospital",
    state: "Lagos",
    city: "Victoria Island",
    address: "39 Idowu Martins St, Victoria Island, Lagos",
    website: "https://reddingtonhospital.com",
    phone: "+234 1 271 5341",
    type: "Private",
    description: "A premium private healthcare provider offering international standard medical services in the heart of Lagos.",
    images: ["https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Maternity", "Cardiology", "Luxury Care"],
    ratingPatient: 4.5,
    ratingEmployee: 4.0,
    reviewCountPatient: 89,
    reviewCountEmployee: 22
  },
  {
    id: "3",
    name: "National Hospital Abuja",
    state: "FCT",
    city: "Abuja",
    address: "265 Independence Ave, Central Business Dis, Abuja",
    phone: "+234 9 234 1234",
    type: "Public",
    description: "A major referral centre designed to cater for the needs of women and children in Nigeria and the West African sub-region.",
    images: ["https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Pediatrics", "Oncology"],
    ratingPatient: 3.8,
    ratingEmployee: 3.2,
    reviewCountPatient: 210,
    reviewCountEmployee: 67
  },
  {
    id: "4",
    name: "First Consultant Medical Centre",
    state: "Lagos",
    city: "Obalende",
    address: "St. Gregory's College Road, Obalende, Lagos",
    type: "Private",
    description: "A renowned private medical centre with a history of excellence in infectious disease management and general care.",
    images: ["https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Infectious Diseases", "General Care"],
    ratingPatient: 4.2,
    ratingEmployee: 3.9,
    reviewCountPatient: 56,
    reviewCountEmployee: 15
  },
  {
    id: "5",
    name: "University College Hospital (UCH)",
    state: "Oyo",
    city: "Ibadan",
    address: "Queen Elizabeth II Road, Oritamefa, Ibadan",
    website: "https://uch-ibadan.org.ng",
    phone: "+234 2 241 0088",
    type: "Teaching",
    description: "The first teaching hospital in Nigeria, affiliated with the University of Ibadan.",
    images: ["https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Teaching", "Neurosurgery", "Maternity"],
    ratingPatient: 3.5,
    ratingEmployee: 3.7,
    reviewCountPatient: 180,
    reviewCountEmployee: 90
  }
];

export const MOCK_PATIENT_REVIEWS: PatientReview[] = [
  {
    id: "101",
    hospitalId: "2",
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
    hospitalId: "1",
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
    hospitalId: "3",
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
    hospitalId: "1",
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
    hospitalId: "2",
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
