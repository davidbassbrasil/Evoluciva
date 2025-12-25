/**
 * Schema.org Structured Data for SEO
 * Implementa schemas JSON-LD para melhorar rich snippets no Google
 */

export interface CourseData {
  id: string;
  name: string;
  description: string;
  price?: number;
  priceOnline?: number;
  instructor?: string;
  image?: string;
  estado?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ReviewData {
  author: string;
  rating: number;
  reviewBody: string;
  datePublished?: string;
}

/**
 * Schema Organization - Usado em todas as páginas
 * Aparece no Knowledge Panel do Google
 */
export const getOrganizationSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "Edu Sampaio Cursos",
    "alternateName": "Eduardo Sampaio Cursos",
    "url": window.location.origin,
    "logo": `${window.location.origin}/logo_.png`,
    "description": "Cursos preparatórios para concursos públicos há mais de 20 anos. Presencial em Maceió/AL e online para todo Brasil.",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Rua Boa Vista, 810 - Centro",
      "addressLocality": "Maceió",
      "addressRegion": "AL",
      "postalCode": "57051-190",
      "addressCountry": "BR"
    },
    "telephone": "+55-82-3336-7480",
    "email": "contato@edusampaio.com",
    "sameAs": [
      "https://www.instagram.com/edu_sampaio_cursos/",
      "https://www.facebook.com/edusampaio.portugues",
      "https://www.youtube.com/user/eduardoredacao"
    ],
    "foundingDate": "2005",
    "founder": {
      "@type": "Person",
      "name": "Eduardo Sampaio",
      "jobTitle": "Professor de Português e Redação"
    }
  };
};

/**
 * Schema Course - Para páginas de cursos individuais
 * Mostra preço, professor e modalidade nos resultados
 */
export const getCourseSchema = (course: CourseData) => {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.name,
    "description": course.description,
    "provider": {
      "@type": "EducationalOrganization",
      "name": "Edu Sampaio Cursos",
      "url": window.location.origin
    }
  };

  // Adicionar instâncias do curso (presencial e/ou online)
  const instances = [];
  
  if (course.price) {
    instances.push({
      "@type": "CourseInstance",
      "courseMode": "onsite",
      "location": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Maceió",
          "addressRegion": "AL",
          "addressCountry": "BR"
        }
      }
    });
  }
  
  if (course.priceOnline) {
    instances.push({
      "@type": "CourseInstance",
      "courseMode": "online"
    });
  }

  if (instances.length > 0) {
    schema.hasCourseInstance = instances;
  }

  // Adicionar oferta de preço
  const offers = [];
  if (course.price) {
    offers.push({
      "@type": "Offer",
      "price": course.price.toFixed(2),
      "priceCurrency": "BRL",
      "availability": "https://schema.org/InStock",
      "category": "Presencial"
    });
  }
  if (course.priceOnline) {
    offers.push({
      "@type": "Offer",
      "price": course.priceOnline.toFixed(2),
      "priceCurrency": "BRL",
      "availability": "https://schema.org/InStock",
      "category": "Online"
    });
  }
  
  if (offers.length > 0) {
    schema.offers = offers;
  }

  // Adicionar instrutor
  if (course.instructor) {
    schema.instructor = {
      "@type": "Person",
      "name": course.instructor
    };
  }

  // Adicionar imagem
  if (course.image) {
    schema.image = course.image;
  }

  return schema;
};

/**
 * Schema FAQPage - Para páginas com perguntas frequentes
 * Aparece como "Perguntas e Respostas" nos resultados do Google
 */
export const getFAQSchema = (faqs: FAQItem[]) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
};

/**
 * Schema AggregateRating - Para mostrar avaliações com estrelas
 * Aparece nos resultados de busca com estrelinhas
 */
export const getAggregateRatingSchema = (
  itemName: string,
  ratingValue: number,
  reviewCount: number,
  reviews?: ReviewData[]
) => {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": itemName,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": ratingValue.toFixed(1),
      "reviewCount": reviewCount
    }
  };

  // Adicionar reviews individuais se fornecidos
  if (reviews && reviews.length > 0) {
    schema.review = reviews.map(review => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.author
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating
      },
      "reviewBody": review.reviewBody,
      ...(review.datePublished && { datePublished: review.datePublished })
    }));
  }

  return schema;
};

/**
 * Schema BreadcrumbList - Para breadcrumbs de navegação
 * Melhora a navegação nos resultados de busca
 */
export const getBreadcrumbSchema = (items: { name: string; url: string }[]) => {
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
};

/**
 * Schema Person - Para página do professor
 * Constrói autoridade pessoal
 */
export const getPersonSchema = (name: string, jobTitle: string, description?: string, image?: string) => {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": name,
    "jobTitle": jobTitle,
    "worksFor": {
      "@type": "Organization",
      "name": "Edu Sampaio Cursos"
    }
  };

  if (description) {
    schema.description = description;
  }

  if (image) {
    schema.image = image;
  }

  return schema;
};

/**
 * Função helper para injetar schema na página
 */
export const injectSchema = (schema: object) => {
  if (typeof window === 'undefined') return;

  const scriptId = 'structured-data-' + JSON.stringify(schema).substring(0, 20);
  
  // Remove schema anterior se existir
  const existingScript = document.getElementById(scriptId);
  if (existingScript) {
    existingScript.remove();
  }

  const script = document.createElement('script');
  script.id = scriptId;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
};
