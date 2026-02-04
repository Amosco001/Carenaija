import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogType?: string;
  ogImage?: string;
  noIndex?: boolean;
  structuredData?: object | object[];
}

const BASE_TITLE = "CareNaija";
const DEFAULT_DESCRIPTION = "Find the best hospitals in Nigeria with verified patient reviews and ratings. Compare hospitals in Lagos, Abuja, and across Nigeria.";
const DEFAULT_KEYWORDS = "hospital reviews Nigeria, best hospitals in Lagos, Nigerian hospital ratings";

export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonicalUrl,
  ogType = "website",
  ogImage = "/attached_assets/hero-hospital.png",
  noIndex = false,
  structuredData,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${BASE_TITLE}` : `${BASE_TITLE} | Hospital Reviews Nigeria`;

  useEffect(() => {
    document.title = fullTitle;

    const updateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    updateMeta("description", description);
    updateMeta("keywords", keywords);
    updateMeta("robots", noIndex ? "noindex, nofollow" : "index, follow");
    
    updateMeta("og:title", fullTitle, true);
    updateMeta("og:description", description, true);
    updateMeta("og:type", ogType, true);
    updateMeta("og:image", ogImage, true);
    
    updateMeta("twitter:title", fullTitle);
    updateMeta("twitter:description", description);
    updateMeta("twitter:image", ogImage);
    updateMeta("twitter:url", canonicalUrl || window.location.href);

    const existingCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonicalUrl) {
      if (existingCanonical) {
        existingCanonical.setAttribute("href", canonicalUrl);
      } else {
        const link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        link.setAttribute("href", canonicalUrl);
        document.head.appendChild(link);
      }
    } else if (existingCanonical) {
      existingCanonical.remove();
    }

    updateMeta("og:url", canonicalUrl || window.location.href, true);

    const existingScripts = document.querySelectorAll('script[data-seo-jsonld]');
    existingScripts.forEach(script => script.remove());

    if (structuredData) {
      const dataArray = Array.isArray(structuredData) ? structuredData : [structuredData];
      dataArray.forEach((data, index) => {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.setAttribute("data-seo-jsonld", `${index}`);
        script.textContent = JSON.stringify(data);
        document.head.appendChild(script);
      });
    }

    return () => {
      const scripts = document.querySelectorAll('script[data-seo-jsonld]');
      scripts.forEach(script => script.remove());
    };
  }, [fullTitle, description, keywords, canonicalUrl, ogType, ogImage, noIndex, structuredData]);

  return null;
}

export function generateHospitalSchema(hospital: {
  id: number;
  name: string;
  address: string;
  state: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  services: string[];
  ownership: string;
  averageRating: number;
  totalReviews: number;
  latitude?: number | null;
  longitude?: number | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Hospital",
    "name": hospital.name,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": hospital.address,
      "addressRegion": hospital.state,
      "addressCountry": "NG"
    },
    "url": `https://www.carenaija.com/hospital/${hospital.id}`,
    ...(hospital.phone && { "telephone": hospital.phone }),
    ...(hospital.email && { "email": hospital.email }),
    ...(hospital.website && { "sameAs": hospital.website }),
    ...(hospital.latitude && hospital.longitude && {
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": hospital.latitude,
        "longitude": hospital.longitude
      }
    }),
    "medicalSpecialty": hospital.services,
    ...(hospital.totalReviews > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": hospital.averageRating.toFixed(1),
        "bestRating": "5",
        "worstRating": "1",
        "ratingCount": hospital.totalReviews
      }
    })
  };
}

export function generateReviewSchema(review: {
  id: number;
  rating: number;
  content: string;
  createdAt: string;
  hospitalName: string;
  authorName?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": {
      "@type": "Hospital",
      "name": review.hospitalName
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": review.rating,
      "bestRating": "5",
      "worstRating": "1"
    },
    "reviewBody": review.content,
    "datePublished": review.createdAt,
    ...(review.authorName && {
      "author": {
        "@type": "Person",
        "name": review.authorName
      }
    })
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}