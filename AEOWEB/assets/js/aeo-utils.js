/**
 * AEO Utilities
 * Helper functions for Answer Engine Optimization
 */

const AEOUtils = {
  /**
   * Track when content is cited or referenced
   * @param {string} source - Where the citation came from
   * @param {string} query - The query that led to citation
   */
  trackCitation(source, query) {
    // Send to analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'aeo_citation', {
        source: source,
        query: query,
        page: window.location.pathname
      });
    }

    // Send to custom endpoint
    fetch('/api/track-citation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source,
        query,
        url: window.location.href,
        timestamp: new Date().toISOString()
      })
    }).catch(err => console.log('Citation tracking failed:', err));
  },

  /**
   * Detect if visitor came from AI engine
   */
  detectAIReferrer() {
    const referrer = document.referrer.toLowerCase();
    const aiEngines = [
      'chat.openai.com',
      'chatgpt.com',
      'perplexity.ai',
      'bard.google.com',
      'copilot.microsoft.com',
      'claude.ai'
    ];

    for (const engine of aiEngines) {
      if (referrer.includes(engine)) {
        this.trackCitation(engine, 'referrer');
        return engine;
      }
    }
    return null;
  },

  /**
   * Test content in AI engines
   * @param {string} question - Question to test
   */
  async testInAI(question) {
    console.log(`Test this question in AI engines: "${question}"`);
    console.log('Your page URL:', window.location.href);
    console.log('Check if your content is cited in the answer');

    // Could integrate with AI APIs here
    return {
      question,
      url: window.location.href,
      testDate: new Date().toISOString()
    };
  },

  /**
   * Generate FAQ schema from content
   * @param {string} selector - CSS selector for FAQ elements
   */
  generateFAQFromContent(selector = '.faq-item') {
    const items = document.querySelectorAll(selector);
    const faqs = [];

    items.forEach(item => {
      const question = item.querySelector('h3, h4, [itemprop="name"]')?.textContent.trim();
      const answer = item.querySelector('p, [itemprop="text"]')?.textContent.trim();

      if (question && answer) {
        faqs.push({ question, answer });
      }
    });

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
  },

  /**
   * Validate page for AEO best practices
   */
  validateAEO() {
    const results = {
      score: 0,
      maxScore: 10,
      issues: [],
      passed: []
    };

    // Check 1: Schema markup exists
    const schemas = document.querySelectorAll('script[type="application/ld+json"]');
    if (schemas.length > 0) {
      results.score++;
      results.passed.push(`✓ Found ${schemas.length} schema markup(s)`);
    } else {
      results.issues.push('✗ No schema markup found');
    }

    // Check 2: FAQ section exists
    const faqSection = document.querySelector('.faq-section, .faq-list');
    if (faqSection) {
      results.score++;
      results.passed.push('✓ FAQ section found');
    } else {
      results.issues.push('✗ No FAQ section found');
    }

    // Check 3: Semantic HTML
    const hasH1 = document.querySelector('h1');
    if (hasH1) {
      results.score++;
      results.passed.push('✓ H1 tag found');
    } else {
      results.issues.push('✗ No H1 tag found');
    }

    // Check 4: Meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && metaDesc.content.length > 50) {
      results.score++;
      results.passed.push('✓ Meta description present');
    } else {
      results.issues.push('✗ Meta description missing or too short');
    }

    // Check 5: Title tag quality
    const title = document.title;
    if (title && title.length >= 30 && title.length <= 60) {
      results.score++;
      results.passed.push('✓ Title tag optimal length');
    } else {
      results.issues.push('✗ Title tag not optimal (should be 30-60 chars)');
    }

    // Check 6: Images have alt text
    const images = document.querySelectorAll('img');
    const imagesWithAlt = Array.from(images).filter(img => img.alt).length;
    if (images.length === imagesWithAlt) {
      results.score++;
      results.passed.push('✓ All images have alt text');
    } else {
      results.issues.push(`✗ ${images.length - imagesWithAlt} images missing alt text`);
    }

    // Check 7: Internal links
    const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="' + window.location.origin + '"]');
    if (internalLinks.length >= 3) {
      results.score++;
      results.passed.push(`✓ ${internalLinks.length} internal links found`);
    } else {
      results.issues.push('✗ Not enough internal links (recommended: 3+)');
    }

    // Check 8: Content length
    const content = document.querySelector('main, article, .content');
    const wordCount = content ? content.textContent.split(/\s+/).length : 0;
    if (wordCount >= 300) {
      results.score++;
      results.passed.push(`✓ Content length: ${wordCount} words`);
    } else {
      results.issues.push(`✗ Content too short: ${wordCount} words (recommended: 300+)`);
    }

    // Check 9: Mobile viewport meta
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      results.score++;
      results.passed.push('✓ Mobile viewport configured');
    } else {
      results.issues.push('✗ Mobile viewport meta tag missing');
    }

    // Check 10: HTTPS
    if (window.location.protocol === 'https:') {
      results.score++;
      results.passed.push('✓ HTTPS enabled');
    } else {
      results.issues.push('✗ HTTPS not enabled');
    }

    // Calculate percentage
    results.percentage = Math.round((results.score / results.maxScore) * 100);

    return results;
  },

  /**
   * Display AEO validation results
   */
  showValidation() {
    const results = this.validateAEO();

    console.group('🔍 AEO Validation Report');
    console.log(`Score: ${results.score}/${results.maxScore} (${results.percentage}%)`);
    console.log('\n✅ Passed Checks:');
    results.passed.forEach(item => console.log(item));
    if (results.issues.length > 0) {
      console.log('\n❌ Issues Found:');
      results.issues.forEach(item => console.log(item));
    }
    console.groupEnd();

    return results;
  },

  /**
   * Monitor page performance for Core Web Vitals
   */
  monitorPerformance() {
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Cumulative Layout Shift (CLS)
      let clsScore = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
          }
        }
        console.log('CLS:', clsScore);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  },

  /**
   * Extract and format questions from page content
   */
  extractQuestions() {
    const questions = [];
    const headings = document.querySelectorAll('h2, h3');

    headings.forEach(heading => {
      const text = heading.textContent.trim();
      if (text.includes('?') ||
          text.toLowerCase().startsWith('how ') ||
          text.toLowerCase().startsWith('what ') ||
          text.toLowerCase().startsWith('why ') ||
          text.toLowerCase().startsWith('when ') ||
          text.toLowerCase().startsWith('where ')) {
        questions.push(text);
      }
    });

    console.log('Questions found on page:', questions);
    return questions;
  },

  /**
   * Initialize AEO tracking and utilities
   */
  init() {
    // Detect AI referrer
    const aiSource = this.detectAIReferrer();
    if (aiSource) {
      console.log('🤖 Visitor from AI engine:', aiSource);
    }

    // Monitor performance
    this.monitorPerformance();

    // Log extracted questions
    this.extractQuestions();

    console.log('💡 AEO Utils initialized. Run AEOUtils.showValidation() to check this page.');
  }
};

// Auto-initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AEOUtils.init());
} else {
  AEOUtils.init();
}

// Make available globally
window.AEOUtils = AEOUtils;
