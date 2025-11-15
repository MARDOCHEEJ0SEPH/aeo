/**
 * AEO Schema Injector
 * Dynamically inject and manage JSON-LD structured data
 */

class SchemaInjector {
  constructor() {
    this.schemas = [];
  }

  /**
   * Add schema markup to page
   * @param {Object} schemaObject - Valid JSON-LD schema
   */
  addSchema(schemaObject) {
    if (!this.validateSchema(schemaObject)) {
      console.error('Invalid schema object:', schemaObject);
      return false;
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schemaObject);
    document.head.appendChild(script);

    this.schemas.push(schemaObject);
    console.log('Schema added:', schemaObject['@type']);
    return true;
  }

  /**
   * Validate schema has required fields
   * @param {Object} schema - Schema to validate
   */
  validateSchema(schema) {
    return schema && schema['@context'] && schema['@type'];
  }

  /**
   * Generate Organization schema from data
   * @param {Object} data - Organization data
   */
  generateOrganizationSchema(data) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: data.name,
      url: data.url || window.location.origin,
      logo: data.logo,
      description: data.description,
      address: data.address,
      telephone: data.telephone,
      email: data.email,
      sameAs: data.socialProfiles || []
    };
  }

  /**
   * Generate FAQPage schema from Q&A array
   * @param {Array} faqs - Array of {question, answer} objects
   */
  generateFAQSchema(faqs) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };
  }

  /**
   * Generate Article schema
   * @param {Object} data - Article data
   */
  generateArticleSchema(data) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: data.headline,
      description: data.description,
      image: data.image,
      author: {
        '@type': 'Person',
        name: data.authorName
      },
      publisher: {
        '@type': 'Organization',
        name: data.publisherName,
        logo: {
          '@type': 'ImageObject',
          url: data.publisherLogo
        }
      },
      datePublished: data.datePublished,
      dateModified: data.dateModified || data.datePublished,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': data.url || window.location.href
      }
    };
  }

  /**
   * Generate Product schema
   * @param {Object} data - Product data
   */
  generateProductSchema(data) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: data.name,
      description: data.description,
      image: data.image,
      brand: {
        '@type': 'Brand',
        name: data.brand
      },
      offers: {
        '@type': 'Offer',
        url: data.url || window.location.href,
        priceCurrency: data.currency || 'USD',
        price: data.price,
        availability: data.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition'
      },
      aggregateRating: data.rating ? {
        '@type': 'AggregateRating',
        ratingValue: data.rating,
        reviewCount: data.reviewCount
      } : undefined
    };
  }

  /**
   * Generate Breadcrumb schema
   * @param {Array} items - Array of {name, url} objects
   */
  generateBreadcrumbSchema(items) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    };
  }

  /**
   * Auto-detect and inject breadcrumbs from DOM
   */
  autoBreadcrumbs() {
    const breadcrumbEl = document.querySelector('.breadcrumbs');
    if (!breadcrumbEl) return;

    const links = breadcrumbEl.querySelectorAll('a');
    const items = Array.from(links).map(link => ({
      name: link.textContent.trim(),
      url: link.href
    }));

    // Add current page if exists
    const current = breadcrumbEl.querySelector('[aria-current="page"]');
    if (current) {
      items.push({
        name: current.textContent.trim(),
        url: window.location.href
      });
    }

    if (items.length > 0) {
      this.addSchema(this.generateBreadcrumbSchema(items));
    }
  }

  /**
   * Auto-detect and inject FAQs from DOM
   */
  autoFAQs() {
    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length === 0) return;

    const faqs = Array.from(faqItems).map(item => {
      const question = item.querySelector('h3')?.textContent.trim();
      const answer = item.querySelector('p')?.textContent.trim();
      return { question, answer };
    }).filter(faq => faq.question && faq.answer);

    if (faqs.length > 0) {
      this.addSchema(this.generateFAQSchema(faqs));
    }
  }

  /**
   * Initialize automatic schema detection
   */
  autoInit() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.autoBreadcrumbs();
        this.autoFAQs();
      });
    } else {
      this.autoBreadcrumbs();
      this.autoFAQs();
    }
  }
}

// Create global instance
const schemaInjector = new SchemaInjector();

// Auto-initialize
schemaInjector.autoInit();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SchemaInjector;
}
