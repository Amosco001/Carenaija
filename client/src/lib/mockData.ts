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
  lga: string; // Added LGA
  city: string;
  address: string;
  website?: string;
  phone?: string;
  email?: string; // Added Email
  type: HospitalType;
  description: string;
  images: string[];
  tags: string[]; // derived tags like "Good for Maternity"
  services: string[]; // Added Services
  ownership: "Government" | "Private"; // Added Ownership
  bedCapacity?: number; // Added Bed Capacity
  operatingHours: string; // Added Operating Hours
  ratingPatient: number;
  ratingEmployee: number;
  reviewCountPatient: number;
  reviewCountEmployee: number;
  latitude: number;
  longitude: number;
};

export type PatientReview = {
  id: string;
  hospitalId: string;
  userId: string;
  userName: string; // denormalized for mock
  reviewerRole: "Patient" | "Family Member" | "Visitor"; // Added Reviewer Role
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
    lga: "Mushin",
    city: "Idi-Araba",
    address: "Ishaga Rd, Idi-Araba, Lagos",
    website: "https://luth.gov.ng",
    phone: "+234 1 234 5678",
    email: "info@luth.gov.ng",
    type: "Teaching",
    description: "One of the largest teaching hospitals in Nigeria, affiliated with the University of Lagos College of Medicine. Known for comprehensive tertiary care.",
    images: ["https://images.unsplash.com/photo-1587351021759-3e566b9af953?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Teaching", "Public", "Referral", "Emergency", "Oncology", "Dentistry"],
    services: ["Oncology", "Dentistry", "Pediatrics", "Surgery", "Emergency", "Radiology"],
    ownership: "Government",
    bedCapacity: 800,
    operatingHours: "24/7",
    ratingPatient: 3.2,
    ratingEmployee: 3.5,
    reviewCountPatient: 124,
    reviewCountEmployee: 45,
    latitude: 6.5244,
    longitude: 3.3556
  },
  {
    id: "lasuth",
    name: "Lagos State University Teaching Hospital (LASUTH)",
    state: "Lagos",
    lga: "Ikeja",
    city: "Ikeja",
    address: "1-5 Oba Akinjobi Way, Ikeja, Lagos",
    website: "https://lasuth.org.ng",
    phone: "+234 1 234 1234",
    email: "enquiry@lasuth.org.ng",
    type: "Teaching",
    description: "The teaching hospital for Lagos State University, known for its busy clinics and specialist services including a Critical Care Unit.",
    images: ["https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Teaching", "Public", "Surgery", "Critical Care", "Pediatrics"],
    services: ["Critical Care", "Surgery", "Pediatrics", "Internal Medicine", "Trauma"],
    ownership: "Government",
    bedCapacity: 400, // Estimated
    operatingHours: "24/7",
    ratingPatient: 3.4,
    ratingEmployee: 3.3,
    reviewCountPatient: 98,
    reviewCountEmployee: 30,
    latitude: 6.5956,
    longitude: 3.3421
  },
  {
    id: "reddington-vi",
    name: "Reddington Hospital",
    state: "Lagos",
    lga: "Eti-Osa",
    city: "Victoria Island",
    address: "12 Idowu Martins St, Victoria Island, Lagos",
    website: "https://reddingtonhospital.com",
    phone: "+234 1 271 5341",
    email: "info@reddingtonhospital.com",
    type: "Private",
    description: "A premium private healthcare provider offering international standard medical services including a specialized cardiac centre. COHSASA accredited.",
    images: ["https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Maternity", "Cardiology", "Luxury Care", "Gastroenterology"],
    services: ["Cardiology", "Gastroenterology", "Nephrology", "Surgery", "Maternity"],
    ownership: "Private",
    bedCapacity: 132,
    operatingHours: "24/7",
    ratingPatient: 4.5,
    ratingEmployee: 4.0,
    reviewCountPatient: 89,
    reviewCountEmployee: 22,
    latitude: 6.4285,
    longitude: 3.4225
  },
  {
    id: "lagoon-vi",
    name: "Lagoon Hospitals (Victoria Island)",
    state: "Lagos",
    lga: "Eti-Osa",
    city: "Victoria Island",
    address: "17B Bishop Aboyade Cole St, Victoria Island, Lagos",
    website: "https://www.lagoonhospitals.com",
    type: "Private",
    description: "Part of the Lagoon Hospitals group, offering premium private healthcare services in VI. First JCI accredited hospital in Nigeria.",
    images: ["https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Luxury", "Specialist", "Orthopedics", "Trauma"],
    services: ["Orthopedics", "Trauma", "Surgery", "General Medicine"],
    ownership: "Private",
    bedCapacity: 50,
    operatingHours: "24/7",
    ratingPatient: 4.1,
    ratingEmployee: 3.8,
    reviewCountPatient: 45,
    reviewCountEmployee: 12,
    latitude: 6.4281,
    longitude: 3.4219
  },
  {
    id: "st-nicholas",
    name: "St. Nicholas Hospital",
    state: "Lagos",
    lga: "Lagos Island",
    city: "Lagos Island",
    address: "57 Campbell St, Lagos Island, Lagos",
    website: "https://saintnicholashospital.com",
    type: "Private",
    description: "A leading multi-specialist hospital in Nigeria, renowned for performing the first kidney transplant in Nigeria.",
    images: ["https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Nephrology", "Surgery", "Transplant", "Oncology"],
    services: ["Nephrology", "Kidney Transplant", "Oncology", "Dialysis"],
    ownership: "Private",
    bedCapacity: 50,
    operatingHours: "24/7",
    ratingPatient: 4.3,
    ratingEmployee: 4.0,
    reviewCountPatient: 60,
    reviewCountEmployee: 18,
    latitude: 6.4531,
    longitude: 3.3958
  },
  {
    id: "gbagada-gen",
    name: "Gbagada General Hospital",
    state: "Lagos",
    lga: "Kosofe",
    city: "Gbagada",
    address: "1 Hospital Rd, Araromi, Gbagada, Lagos",
    type: "Public",
    description: "A major general hospital serving the mainland population, with various specialist units including a cardiac and renal centre.",
    images: ["https://images.unsplash.com/photo-1587351021759-3e566b9af953?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Public", "General Care", "Dialysis", "Cardiac"],
    services: ["General Medicine", "Dialysis", "Cardiology", "Emergency"],
    ownership: "Government",
    bedCapacity: 200,
    operatingHours: "24/7",
    ratingPatient: 3.0,
    ratingEmployee: 3.1,
    reviewCountPatient: 110,
    reviewCountEmployee: 35,
    latitude: 6.5569,
    longitude: 3.3914
  },
  {
    id: "igbobi-ortho",
    name: "National Orthopaedic Hospital, Igbobi",
    state: "Lagos",
    lga: "Somolu",
    city: "Igbobi",
    address: "Ikorodu Road, Igbobi, Lagos",
    type: "Federal",
    description: "The premier orthopaedic hospital in Nigeria, specializing in bone surgery, trauma, and rehabilitation.",
    images: ["https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Federal", "Orthopedics", "Trauma", "Rehabilitation"],
    services: ["Orthopedics", "Trauma Surgery", "Physiotherapy", "Prosthetics"],
    ownership: "Government",
    bedCapacity: 450,
    operatingHours: "24/7",
    ratingPatient: 3.5,
    ratingEmployee: 3.2,
    reviewCountPatient: 150,
    reviewCountEmployee: 60,
    latitude: 6.5333,
    longitude: 3.3667
  },
  {
    id: "fmc-ebute-metta",
    name: "Federal Medical Centre, Ebute Metta",
    state: "Lagos",
    lga: "Lagos Mainland",
    city: "Ebute-Metta",
    address: "Railway Compound, Ebute-Metta, Lagos",
    type: "Federal",
    description: "A federal tertiary health institution known for quality and affordable healthcare services.",
    images: ["https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Federal", "Public", "General Care", "Surgery"],
    services: ["General Surgery", "Internal Medicine", "Pediatrics", "Obstetrics"],
    ownership: "Government",
    bedCapacity: 300,
    operatingHours: "24/7",
    ratingPatient: 3.6,
    ratingEmployee: 3.4,
    reviewCountPatient: 115,
    reviewCountEmployee: 42,
    latitude: 6.4886,
    longitude: 3.3792
  },
  {
    id: "eko-hospital",
    name: "Eko Hospital",
    state: "Lagos",
    lga: "Ikeja",
    city: "Ikeja",
    address: "Mobolaji Bank Anthony Way, Ikeja, Lagos",
    website: "https://ekohospitals.com",
    type: "Private",
    description: "A PLC hospital group providing a wide range of specialist services.",
    images: ["https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "General Care", "Radiotherapy"],
    services: ["Radiotherapy", "General Medicine", "Surgery"],
    ownership: "Private",
    bedCapacity: 130,
    operatingHours: "24/7",
    ratingPatient: 3.6,
    ratingEmployee: 3.4,
    reviewCountPatient: 55,
    reviewCountEmployee: 20,
    latitude: 6.5774,
    longitude: 3.3662
  },
  {
    id: "first-consultants",
    name: "First Consultants Medical Centre",
    state: "Lagos",
    lga: "Eti-Osa",
    city: "Obalende",
    address: "St. Gregory's College Road, Obalende, Lagos",
    type: "Private",
    description: "Historic private hospital known for excellence in general practice and infectious disease management.",
    images: ["https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Infectious Diseases", "General Care"],
    services: ["General Practice", "Infectious Diseases", "Gynecology"],
    ownership: "Private",
    bedCapacity: 40,
    operatingHours: "24/7",
    ratingPatient: 4.2,
    ratingEmployee: 3.9,
    reviewCountPatient: 56,
    reviewCountEmployee: 15,
    latitude: 6.4453,
    longitude: 3.4112
  },
  {
    id: "evercare-lekki",
    name: "Evercare Hospital Lekki",
    state: "Lagos",
    lga: "Eti-Osa",
    city: "Lekki",
    address: "Bisola Durosinmi Etti Dr, Lekki Phase 1, Lagos",
    website: "https://evercare.ng",
    type: "Private",
    description: "A 165-bed multispecialty tertiary care facility offering international standards.",
    images: ["https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "International", "Multispecialty"],
    services: ["Cardiology", "Neurology", "Orthopedics", "Critical Care"],
    ownership: "Private",
    bedCapacity: 165,
    operatingHours: "24/7",
    ratingPatient: 4.6,
    ratingEmployee: 4.3,
    reviewCountPatient: 52,
    reviewCountEmployee: 18,
    latitude: 6.4474,
    longitude: 3.4731
  },
  {
    id: "st-ives-ikeja",
    name: "St. Ives Hospital",
    state: "Lagos",
    lga: "Ikeja",
    city: "Ikeja",
    address: "12 Salvation Road, Opebi, Ikeja",
    type: "Private",
    description: "Renowned for fertility services and women's health.",
    images: ["https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Fertility", "IVF", "Women's Health"],
    services: ["IVF", "Gynecology", "Obstetrics"],
    ownership: "Private",
    bedCapacity: 45,
    operatingHours: "24/7",
    ratingPatient: 4.4,
    ratingEmployee: 4.1,
    reviewCountPatient: 70,
    reviewCountEmployee: 25,
    latitude: 6.5938,
    longitude: 3.3576
  },
  {
    id: "paelon-vi",
    name: "Paelon Memorial Hospital",
    state: "Lagos",
    lga: "Eti-Osa",
    city: "Victoria Island",
    address: "1221 Ahmadu Bello Way, Victoria Island, Lagos",
    website: "https://paelonmemorial.com",
    type: "Private",
    description: "A multi-specialist boutique hospital known for evidence-based care.",
    images: ["https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Boutique", "Family Medicine"],
    services: ["Family Medicine", "Pediatrics", "Corporate Health"],
    ownership: "Private",
    bedCapacity: 25,
    operatingHours: "24/7",
    ratingPatient: 4.5,
    ratingEmployee: 4.2,
    reviewCountPatient: 40,
    reviewCountEmployee: 15,
    latitude: 6.4253,
    longitude: 3.4211
  },
  {
    id: "nordica-lagos",
    name: "Nordica Fertility Centre",
    state: "Lagos",
    lga: "Ikoyi",
    city: "Ikoyi",
    address: "106/108 Norman Williams Street, Ikoyi, Lagos",
    type: "Private",
    description: "Leading assisted conception centre in Nigeria.",
    images: ["https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Fertility", "IVF"],
    services: ["IVF", "Egg Freezing", "Andrology"],
    ownership: "Private",
    bedCapacity: 15,
    operatingHours: "8am - 5pm",
    ratingPatient: 4.7,
    ratingEmployee: 4.3,
    reviewCountPatient: 85,
    reviewCountEmployee: 20,
    latitude: 6.4442,
    longitude: 3.4185
  },
  {
    id: "general-hospital-lagos",
    name: "Lagos Island General Hospital (Odan)",
    state: "Lagos",
    lga: "Lagos Island",
    city: "Lagos Island",
    address: "1-3 Broad Street, Odan, Lagos",
    type: "Public",
    description: "One of the oldest hospitals in Lagos, providing a wide range of secondary healthcare services.",
    images: ["https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Public", "General Care", "Historic"],
    services: ["General Medicine", "Surgery", "Maternity", "Eye Clinic"],
    ownership: "Government",
    bedCapacity: 250,
    operatingHours: "24/7",
    ratingPatient: 3.1,
    ratingEmployee: 3.0,
    reviewCountPatient: 130,
    reviewCountEmployee: 45,
    latitude: 6.4539,
    longitude: 3.3903
  },
  {
    id: "general-hospital-ikeja",
    name: "General Hospital, Ikeja",
    state: "Lagos",
    lga: "Ikeja",
    city: "Ikeja",
    address: "349b Odusami Street, off Wemco Rd, Ogba, Ikeja",
    type: "Public",
    description: "A busy general hospital serving the capital's population.",
    images: ["https://images.unsplash.com/photo-1587351021759-3e566b9af953?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Public", "General Care"],
    services: ["General Medicine", "Surgery", "Pediatrics"],
    ownership: "Government",
    bedCapacity: 180,
    operatingHours: "24/7",
    ratingPatient: 3.2,
    ratingEmployee: 3.1,
    reviewCountPatient: 95,
    reviewCountEmployee: 35,
    latitude: 6.6219,
    longitude: 3.3461
  },
  {
    id: "general-hospital-ikorodu",
    name: "General Hospital, Ikorodu",
    state: "Lagos",
    lga: "Ikorodu",
    city: "Ikorodu",
    address: "TOS Benson Road, Ebute, Ikorodu",
    type: "Public",
    description: "Key healthcare provider for the Ikorodu division.",
    images: ["https://images.unsplash.com/photo-1587351021759-3e566b9af953?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Public", "General Care"],
    services: ["General Medicine", "Maternity", "Emergency"],
    ownership: "Government",
    bedCapacity: 150,
    operatingHours: "24/7",
    ratingPatient: 3.0,
    ratingEmployee: 3.2,
    reviewCountPatient: 80,
    reviewCountEmployee: 30,
    latitude: 6.6083,
    longitude: 3.4917
  },
  {
    id: "general-hospital-badagry",
    name: "General Hospital, Badagry",
    state: "Lagos",
    lga: "Badagry",
    city: "Badagry",
    address: "Badagry, Lagos",
    type: "Public",
    description: "Serving the coastal town of Badagry.",
    images: ["https://images.unsplash.com/photo-1587351021759-3e566b9af953?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Public", "General Care"],
    services: ["General Medicine", "Maternity"],
    ownership: "Government",
    bedCapacity: 100,
    operatingHours: "24/7",
    ratingPatient: 2.9,
    ratingEmployee: 3.0,
    reviewCountPatient: 60,
    reviewCountEmployee: 20,
    latitude: 6.4167,
    longitude: 2.8833
  },
  {
    id: "general-hospital-epe",
    name: "General Hospital, Epe",
    state: "Lagos",
    lga: "Epe",
    city: "Epe",
    address: "Epe, Lagos",
    type: "Public",
    description: "Main healthcare facility for Epe LGA.",
    images: ["https://images.unsplash.com/photo-1587351021759-3e566b9af953?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Public", "General Care"],
    services: ["General Medicine", "Maternity"],
    ownership: "Government",
    bedCapacity: 120,
    operatingHours: "24/7",
    ratingPatient: 3.1,
    ratingEmployee: 3.1,
    reviewCountPatient: 50,
    reviewCountEmployee: 15,
    latitude: 6.5833,
    longitude: 3.9833
  },
  {
    id: "general-hospital-alimosho",
    name: "Alimosho General Hospital",
    state: "Lagos",
    lga: "Alimosho",
    city: "Igando",
    address: "Lasu-Isheri Rd, Igando, Lagos",
    type: "Public",
    description: "Serving the largest LGA in Lagos state.",
    images: ["https://images.unsplash.com/photo-1587351021759-3e566b9af953?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Public", "General Care"],
    services: ["General Medicine", "Maternity", "Pediatrics"],
    ownership: "Government",
    bedCapacity: 200,
    operatingHours: "24/7",
    ratingPatient: 3.2,
    ratingEmployee: 3.3,
    reviewCountPatient: 110,
    reviewCountEmployee: 40,
    latitude: 6.5592,
    longitude: 3.2503
  },
  {
    id: "duchess-ikeja",
    name: "Duchess International Hospital",
    state: "Lagos",
    lga: "Ikeja",
    city: "Ikeja",
    address: "22A Joel Ogunnaike St, Ikeja GRA, Lagos",
    type: "Private",
    description: "Modern luxury hospital in Ikeja GRA.",
    images: ["https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Luxury", "Cardiology"],
    services: ["Cardiology", "Surgery", "Wellness"],
    ownership: "Private",
    bedCapacity: 72,
    operatingHours: "24/7",
    ratingPatient: 4.7,
    ratingEmployee: 4.2,
    reviewCountPatient: 35,
    reviewCountEmployee: 12,
    latitude: 6.5818,
    longitude: 3.3562
  },
  {
    id: "kelina-vi",
    name: "Kelina Hospital",
    state: "Lagos",
    lga: "Eti-Osa",
    city: "Victoria Island",
    address: "7 Ologun Agbaje St, Victoria Island, Lagos",
    type: "Private",
    description: "Specialized in Minimally Invasive Surgery.",
    images: ["https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Surgery", "Urology"],
    services: ["Laser Surgery", "Urology", "Lithotripsy"],
    ownership: "Private",
    bedCapacity: 30,
    operatingHours: "24/7",
    ratingPatient: 4.5,
    ratingEmployee: 4.1,
    reviewCountPatient: 25,
    reviewCountEmployee: 10,
    latitude: 6.4298,
    longitude: 3.4143
  },
  {
    id: "bridge-clinic-ikeja",
    name: "The Bridge Clinic",
    state: "Lagos",
    lga: "Ikeja",
    city: "Ikeja",
    address: "66 Oduduwa Way, Ikeja GRA, Lagos",
    type: "Private",
    description: "Pioneering fertility clinic in West Africa.",
    images: ["https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Fertility"],
    services: ["IVF", "Fertility Treatment"],
    ownership: "Private",
    bedCapacity: 10,
    operatingHours: "8am - 5pm",
    ratingPatient: 4.6,
    ratingEmployee: 4.4,
    reviewCountPatient: 60,
    reviewCountEmployee: 22,
    latitude: 6.5764,
    longitude: 3.3567
  },
  {
    id: "eye-foundation-ikeja",
    name: "Eye Foundation Hospital",
    state: "Lagos",
    lga: "Ikeja",
    city: "Ikeja",
    address: "27 Isaac John St, Ikeja GRA, Lagos",
    type: "Private",
    description: "Premier eye care specialist hospital.",
    images: ["https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Eye Care", "Ophthalmology"],
    services: ["Cataract Surgery", "Lasik", "Glaucoma Treatment"],
    ownership: "Private",
    bedCapacity: 20,
    operatingHours: "8am - 6pm",
    ratingPatient: 4.4,
    ratingEmployee: 4.0,
    reviewCountPatient: 55,
    reviewCountEmployee: 18,
    latitude: 6.5828,
    longitude: 3.3551
  },
  {
    id: "cedarcrest-vi",
    name: "Cedarcrest Hospitals",
    state: "Lagos",
    lga: "Eti-Osa",
    city: "Victoria Island",
    address: "25A Kofo Abayomi St, Victoria Island, Lagos",
    type: "Private",
    description: "Modern specialist hospital known for orthopedics and trauma.",
    images: ["https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1000"],
    tags: ["Private", "Orthopedics", "Trauma"],
    services: ["Orthopedics", "Trauma", "Surgery"],
    ownership: "Private",
    bedCapacity: 40,
    operatingHours: "24/7",
    ratingPatient: 4.4,
    ratingEmployee: 4.0,
    reviewCountPatient: 45,
    reviewCountEmployee: 15,
    latitude: 6.4278,
    longitude: 3.4119
  }
];

export const MOCK_HOSPITALS: Hospital[] = [
  ...LAGOS_HOSPITALS
  // ... (Other states remain similar, just truncated for this update to focus on Lagos Schema)
];

// Keep existing reviews for demo purposes
export const MOCK_PATIENT_REVIEWS: PatientReview[] = [
  {
    id: "101",
    hospitalId: "reddington-vi",
    userId: "u1",
    userName: "Nneka A.",
    reviewerRole: "Patient",
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
    reviewerRole: "Patient",
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
    reviewerRole: "Patient",
    rating: 4,
    title: "Good care but expensive",
    comment: "Quality of care is comparable to private hospitals abroad, but the billing process is opaque.",
    tags: ["Billing", "Quality"],
    date: "2023-12-05",
    isVisible: true
  },
  {
    id: "104",
    hospitalId: "st-nicholas",
    userId: "u4",
    userName: "Mrs. Ojo",
    reviewerRole: "Family Member",
    rating: 5,
    title: "Saved my husband's life",
    comment: "The kidney transplant team was phenomenal. They explained every step to us and the post-op care was excellent. Grateful to Dr. Bamgboye and team.",
    tags: ["Surgery", "Staff"],
    date: "2024-01-15",
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
