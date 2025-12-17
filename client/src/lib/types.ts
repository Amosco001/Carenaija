export type Hospital = {
  id: number;
  name: string;
  address: string;
  city: string | null;
  lga: string;
  state: string;
  phone: string | null;
  ownership: string;
  bedCapacity: number | null;
  operatingHours: string | null;
  services: string[];
  facilities: string[];
  email: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  verified: boolean;
  averageRating: number | null;
  totalReviews: number | null;
  claimedBy: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type PatientReview = {
  id: number;
  hospitalId: number;
  userId: string;
  reviewerName: string;
  reviewerRole: string;
  rating: number;
  waitTime: string | null;
  cleanliness: number | null;
  staffAttitude: number | null;
  facilities: number | null;
  reviewText: string;
  wouldRecommend: boolean;
  createdAt: Date | null;
};

export type EmployeeReview = {
  id: number;
  hospitalId: number;
  userId: string;
  reviewerName: string;
  position: string;
  employmentStatus: string;
  rating: number;
  workLifeBalance: number | null;
  compensation: number | null;
  management: number | null;
  careerGrowth: number | null;
  reviewText: string;
  pros: string | null;
  cons: string | null;
  wouldRecommend: boolean;
  createdAt: Date | null;
};

export type HospitalSuggestion = {
  id: number;
  userId: string | null;
  suggestedBy: string;
  name: string;
  address: string;
  lga: string;
  state: string;
  ownership: string;
  bedCapacity: number | null;
  operatingHours: string | null;
  services: string[];
  email: string | null;
  phone: string | null;
  additionalInfo: string | null;
  status: string;
  createdAt: Date | null;
};

export type ClaimRequest = {
  id: number;
  hospitalId: number;
  userId: string | null;
  fullName: string;
  position: string;
  email: string;
  phone: string;
  verificationDoc: string | null;
  additionalInfo: string | null;
  status: string;
  createdAt: Date | null;
};

export type User = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};
