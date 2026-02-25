import luthHospitalImage from "@assets/generated_images/luth_hospital_lagos_nigeria.png";
import neuropsychHospitalImage from "@assets/generated_images/neuropsychiatric_hospital_yaba.png";
import orthoHospitalImage from "@assets/generated_images/orthopaedic_hospital_igbobi.png";
import reddingtonImage from "@assets/generated_images/reddington_hospital_lagos.png";
import lagoonImage from "@assets/generated_images/lagoon_hospital_victoria_island.png";
import stNicholasImage from "@assets/generated_images/st_nicholas_hospital_lagos.png";
import lasuthImage from "@assets/generated_images/lasuth_hospital_ikeja.png";
import gbagadaImage from "@assets/generated_images/gbagada_general_hospital.png";
import evercareImage from "@assets/generated_images/evercare_hospital_lekki.png";
import ekoImage from "@assets/generated_images/eko_hospital_ikeja.png";
import duchessImage from "@assets/generated_images/duchess_hospital_ikeja.png";
import generalHospitalImage from "@assets/generated_images/general_hospital_nigeria.png";
import fertilityClinicImage from "@assets/generated_images/fertility_clinic_nigeria.png";
import privateSpecialistImage from "@assets/generated_images/private_specialist_hospital.png";
import eyeHospitalImage from "@assets/generated_images/eye_hospital_nigeria.png";
import federalMedicalImage from "@assets/generated_images/federal_medical_centre.png";
import lagosIslandGeneralImage from "@assets/generated_images/lagos_island_general_hospital.png";
import surgicalHospitalImage from "@assets/generated_images/surgical_hospital_nigeria.png";

const hospitalImageMap: Record<string, string> = {
  "luth": luthHospitalImage,
  "lasuth": lasuthImage,
  "reddington-vi": reddingtonImage,
  "lagoon-vi": lagoonImage,
  "st-nicholas": stNicholasImage,
  "gbagada-gen": gbagadaImage,
  "igbobi-ortho": orthoHospitalImage,
  "fmc-ebute-metta": federalMedicalImage,
  "eko-hospital": ekoImage,
  "evercare-lekki": evercareImage,
  "duchess-ikeja": duchessImage,
  "general-hospital-lagos": lagosIslandGeneralImage,
  "general-hospital-ikeja": generalHospitalImage,
  "general-hospital-ikorodu": generalHospitalImage,
  "general-hospital-badagry": generalHospitalImage,
  "general-hospital-epe": generalHospitalImage,
  "general-hospital-alimosho": generalHospitalImage,
  "nordica-lagos": fertilityClinicImage,
  "st-ives-ikeja": fertilityClinicImage,
  "bridge-clinic-ikeja": fertilityClinicImage,
  "eye-foundation-ikeja": eyeHospitalImage,
  "first-consultants": privateSpecialistImage,
  "paelon-vi": privateSpecialistImage,
  "kelina-vi": surgicalHospitalImage,
  "cedarcrest-vi": privateSpecialistImage,
};

const categoryFallbacks: Record<string, string> = {
  "Government": generalHospitalImage,
  "Private": privateSpecialistImage,
  "Teaching": luthHospitalImage,
  "Federal": federalMedicalImage,
  "Specialist": privateSpecialistImage,
  "Public": generalHospitalImage,
};

export function getHospitalImage(hospital: { id: number; slug?: string | null; name?: string; ownership?: string; type?: string }): string {
  if (hospital.slug && hospitalImageMap[hospital.slug]) {
    return hospitalImageMap[hospital.slug];
  }

  if (hospital.ownership && categoryFallbacks[hospital.ownership]) {
    return categoryFallbacks[hospital.ownership];
  }

  const idx = hospital.id % allImages.length;
  return allImages[idx];
}

const allImages = [
  luthHospitalImage,
  reddingtonImage,
  lagoonImage,
  stNicholasImage,
  lasuthImage,
  gbagadaImage,
  evercareImage,
  ekoImage,
  duchessImage,
  generalHospitalImage,
  fertilityClinicImage,
  privateSpecialistImage,
  eyeHospitalImage,
  federalMedicalImage,
  lagosIslandGeneralImage,
  surgicalHospitalImage,
  orthoHospitalImage,
  neuropsychHospitalImage,
];

export { allImages as hospitalImages };
