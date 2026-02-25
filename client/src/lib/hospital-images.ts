const hospitalImageMap: Record<string, string> = {
  "lagos-university-teaching-hospital-luth": "https://luth.gov.ng/static/statue4-3eac85e500a5ff4a3701f7289a40e422.jpg",
  "lagos-state-university-teaching-hospital-lasuth": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Ikeja_General_Hospital_Nigeria_1972_Designed_by_Michael_Olutusen_Onafowokan_Lagos_State_Govt_022.jpg/800px-Ikeja_General_Hospital_Nigeria_1972_Designed_by_Michael_Olutusen_Onafowokan_Lagos_State_Govt_022.jpg",
  "reddington-hospital": "https://reddingtonhospital.com/wp-content/uploads/2022/05/04-2-1.jpg",
  "lagoon-hospitals-victoria-island": "https://www.lagoonhospitals.com/wp-content/uploads/2024/01/cardiology.jpg",
  "st-nicholas-hospital": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/St._Nicholas_Hospital%2C_Lagos.jpg/800px-St._Nicholas_Hospital%2C_Lagos.jpg",
  "national-orthopaedic-hospital-igbobi": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Igbobi_autopedic_hospital_Lagos.jpg/800px-Igbobi_autopedic_hospital_Lagos.jpg",
  "eko-hospital": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/EKO_hospital_Victoria_Island%2CLagos.jpg/800px-EKO_hospital_Victoria_Island%2CLagos.jpg",
  "duchess-international-hospital": "https://duchesshospital.com/wp-content/uploads/2025/07/Duchess-Hospital-Best-Private-Hospital-of-the-year-2025.jpg",
  "federal-medical-centre-ebute-metta": "https://fmceb.org/front_assets/img/hero1.jpg",
  "eye-foundation-hospital": "https://www.eyefoundationhospital.com/assets/img/ikeja.png",
};

const nameImageMap: Record<string, string> = {
  "lagos university teaching hospital": "https://luth.gov.ng/static/statue4-3eac85e500a5ff4a3701f7289a40e422.jpg",
  "lasuth": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Ikeja_General_Hospital_Nigeria_1972_Designed_by_Michael_Olutusen_Onafowokan_Lagos_State_Govt_022.jpg/800px-Ikeja_General_Hospital_Nigeria_1972_Designed_by_Michael_Olutusen_Onafowokan_Lagos_State_Govt_022.jpg",
  "reddington": "https://reddingtonhospital.com/wp-content/uploads/2022/05/04-2-1.jpg",
  "lagoon hospital": "https://www.lagoonhospitals.com/wp-content/uploads/2024/01/cardiology.jpg",
  "st. nicholas": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/St._Nicholas_Hospital%2C_Lagos.jpg/800px-St._Nicholas_Hospital%2C_Lagos.jpg",
  "st nicholas": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/St._Nicholas_Hospital%2C_Lagos.jpg/800px-St._Nicholas_Hospital%2C_Lagos.jpg",
  "orthopaedic hospital": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Igbobi_autopedic_hospital_Lagos.jpg/800px-Igbobi_autopedic_hospital_Lagos.jpg",
  "eko hospital": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/EKO_hospital_Victoria_Island%2CLagos.jpg/800px-EKO_hospital_Victoria_Island%2CLagos.jpg",
  "duchess": "https://duchesshospital.com/wp-content/uploads/2025/07/Duchess-Hospital-Best-Private-Hospital-of-the-year-2025.jpg",
  "federal medical centre": "https://fmceb.org/front_assets/img/hero1.jpg",
  "eye foundation": "https://www.eyefoundationhospital.com/assets/img/ikeja.png",
};

export function getHospitalImage(hospital: { id: number; slug?: string | null; name?: string; ownership?: string; type?: string }): string {
  if (hospital.slug && hospitalImageMap[hospital.slug]) {
    return hospitalImageMap[hospital.slug];
  }

  if (hospital.name) {
    const lowerName = hospital.name.toLowerCase();
    for (const [key, url] of Object.entries(nameImageMap)) {
      if (lowerName.includes(key)) {
        return url;
      }
    }
  }

  return "";
}

export function getHospitalInitials(name: string): string {
  return name
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter(w => w.length > 2 || w === w.toUpperCase())
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join("");
}
