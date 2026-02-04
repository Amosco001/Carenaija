import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogType?: "website" | "article" | "profile";
  ogImage?: string;
  ogImageAlt?: string;
  twitterCard?: "summary" | "summary_large_image";
  noIndex?: boolean;
  structuredData?: object;
}

const BASE_URL = "https://www.carenaija.com";
const DEFAULT_IMAGE = "/attached_assets/hero-hospital.png";
const SITE_NAME = "CareNaija";

export function SEO({
  title,
  description,
  keywords,
  canonicalUrl,
  ogType = "website",
  ogImage = DEFAULT_IMAGE,
  ogImageAlt = "CareNaija - Hospital Reviews Nigeria",
  twitterCard = "summary_large_image",
  noIndex = false,
  structuredData,
}: SEOProps) {
  useEffect(() => {
    document.title = title;

    const updateMeta = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let element = document.querySelector(selector) as HTMLMetaElement;
      if (element) {
        element.content = content;
      } else {
        element = document.createElement("meta");
        if (isProperty) {
          element.setAttribute("property", name);
        } else {
          element.setAttribute("name", name);
        }
        element.content = content;
        document.head.appendChild(element);
      }
    };

    updateMeta("description", description);
    if (keywords) updateMeta("keywords", keywords);
    updateMeta("robots", noIndex ? "noindex, nofollow" : "index, follow");

    updateMeta("og:title", title, true);
    updateMeta("og:description", description, true);
    updateMeta("og:type", ogType, true);
    updateMeta("og:url", canonicalUrl ? `${BASE_URL}${canonicalUrl}` : BASE_URL, true);
    updateMeta("og:image", ogImage.startsWith("http") ? ogImage : `${BASE_URL}${ogImage}`, true);
    updateMeta("og:image:alt", ogImageAlt, true);
    updateMeta("og:site_name", SITE_NAME, true);

    updateMeta("twitter:card", twitterCard);
    updateMeta("twitter:title", title);
    updateMeta("twitter:description", description);
    updateMeta("twitter:image", ogImage.startsWith("http") ? ogImage : `${BASE_URL}${ogImage}`);
    updateMeta("twitter:image:alt", ogImageAlt);

    let canonicalElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonicalUrl) {
      if (canonicalElement) {
        canonicalElement.href = `${BASE_URL}${canonicalUrl}`;
      } else {
        canonicalElement = document.createElement("link");
        canonicalElement.rel = "canonical";
        canonicalElement.href = `${BASE_URL}${canonicalUrl}`;
        document.head.appendChild(canonicalElement);
      }
    }

    if (structuredData) {
      const existingScript = document.querySelector('script[data-seo-jsonld]');
      if (existingScript) {
        existingScript.remove();
      }
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-jsonld", "true");
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    return () => {
      const dynamicScript = document.querySelector('script[data-seo-jsonld]');
      if (dynamicScript) {
        dynamicScript.remove();
      }
    };
  }, [title, description, keywords, canonicalUrl, ogType, ogImage, ogImageAlt, twitterCard, noIndex, structuredData]);

  return null;
}

export function generateHospitalStructuredData(hospital: {
  id: number;
  name: string;
  address: string;
  city?: string | null;
  state: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  averageRating?: number | null;
  totalReviews?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  operatingHours?: string | null;
  services?: string[];
}) {
  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["MedicalOrganization", "LocalBusiness"],
    "@id": `${BASE_URL}/hospital/${hospital.id}`,
    name: hospital.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: hospital.address,
      addressLocality: hospital.city || hospital.state,
      addressRegion: hospital.state,
      addressCountry: "NG",
    },
    url: `${BASE_URL}/hospital/${hospital.id}`,
  };

  if (hospital.phone) {
    structuredData.telephone = hospital.phone;
  }

  if (hospital.email) {
    structuredData.email = hospital.email;
  }

  if (hospital.website) {
    structuredData.sameAs = [hospital.website];
  }

  if (hospital.latitude && hospital.longitude) {
    structuredData.geo = {
      "@type": "GeoCoordinates",
      latitude: hospital.latitude,
      longitude: hospital.longitude,
    };
  }

  if (hospital.averageRating && hospital.totalReviews && hospital.totalReviews > 0) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: hospital.averageRating.toFixed(1),
      bestRating: "5",
      worstRating: "1",
      ratingCount: hospital.totalReviews,
    };
  }

  if (hospital.operatingHours) {
    structuredData.openingHours = hospital.operatingHours;
  }

  if (hospital.services && hospital.services.length > 0) {
    structuredData.medicalSpecialty = hospital.services.slice(0, 5);
  }

  return structuredData;
}

export function generateBreadcrumbStructuredData(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
}

export function generateArticleStructuredData(article: {
  title: string;
  description: string;
  slug: string;
  publishedAt?: string;
  author?: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    url: `${BASE_URL}/blog/${article.slug}`,
    datePublished: article.publishedAt || new Date().toISOString(),
    author: {
      "@type": "Organization",
      name: article.author || "CareNaija",
    },
    publisher: {
      "@type": "Organization",
      name: "CareNaija",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/favicon.png`,
      },
    },
    image: article.image || `${BASE_URL}${DEFAULT_IMAGE}`,
  };
}

export function generateFAQStructuredData(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
