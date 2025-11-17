import natural from 'natural';
import compromise from 'compromise';
import { fleschReadingEase, fleschKincaidGrade } from 'readability-scores';
import * as cheerio from 'cheerio';

// AI Platform types
export type AIPlatform = 'CHATGPT' | 'CLAUDE' | 'PERPLEXITY' | 'GEMINI' | 'BING';

// Scoring result
export interface AEOScore {
  overallScore: number;
  structureScore: number;
  qualityScore: number;
  platformScore: number;
  readabilityScore: number;
  improvements: Improvement[];
}

export interface Improvement {
  category: string;
  description: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

// AEO Optimizer Class
export class AEOOptimizer {
  private tokenizer: natural.WordTokenizer;
  private tfidf: natural.TfIdf;

  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
  }

  /**
   * Calculate comprehensive AEO score for content
   */
  public async calculateScore(content: string, platform: AIPlatform): Promise<AEOScore> {
    const improvements: Improvement[] = [];

    // 1. Structure Score (30 points)
    const structureScore = this.calculateStructureScore(content, improvements);

    // 2. Quality Score (25 points)
    const qualityScore = this.calculateQualityScore(content, improvements);

    // 3. Platform-Specific Score (25 points)
    const platformScore = this.calculatePlatformScore(content, platform, improvements);

    // 4. Readability Score (20 points)
    const readabilityScore = this.calculateReadabilityScore(content, improvements);

    // Overall score
    const overallScore = structureScore + qualityScore + platformScore + readabilityScore;

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      structureScore: Math.round(structureScore * 100) / 100,
      qualityScore: Math.round(qualityScore * 100) / 100,
      platformScore: Math.round(platformScore * 100) / 100,
      readabilityScore: Math.round(readabilityScore * 100) / 100,
      improvements,
    };
  }

  /**
   * Calculate structure score (30 points max)
   * Evaluates: headings, paragraphs, lists, length, schema.org potential
   */
  private calculateStructureScore(content: string, improvements: Improvement[]): number {
    let score = 0;
    const $ = cheerio.load(content);

    // Has H1 heading (5 points)
    const h1Count = $('h1').length;
    if (h1Count === 1) {
      score += 5;
    } else if (h1Count === 0) {
      improvements.push({
        category: 'Structure',
        description: 'Add a clear H1 heading to define the main topic',
        impact: 'HIGH',
      });
    } else {
      improvements.push({
        category: 'Structure',
        description: 'Use only one H1 heading per content',
        impact: 'MEDIUM',
      });
      score += 2;
    }

    // Has hierarchical headings (5 points)
    const h2Count = $('h2').length;
    const h3Count = $('h3').length;
    if (h2Count >= 2 && h2Count <= 8) {
      score += 5;
    } else if (h2Count === 0) {
      improvements.push({
        category: 'Structure',
        description: 'Add H2 subheadings to organize content into clear sections',
        impact: 'HIGH',
      });
    }

    // Has lists (3 points)
    const listCount = $('ul, ol').length;
    if (listCount >= 1) {
      score += 3;
    } else {
      improvements.push({
        category: 'Structure',
        description: 'Use bullet points or numbered lists for better scannability',
        impact: 'MEDIUM',
      });
    }

    // Paragraph structure (5 points)
    const paragraphs = $('p');
    const avgParagraphLength = Array.from(paragraphs)
      .map((p) => $(p).text().split(' ').length)
      .reduce((a, b) => a + b, 0) / paragraphs.length;

    if (avgParagraphLength >= 20 && avgParagraphLength <= 80) {
      score += 5;
    } else if (avgParagraphLength > 100) {
      improvements.push({
        category: 'Structure',
        description: 'Break down long paragraphs into shorter, digestible chunks (aim for 20-80 words)',
        impact: 'MEDIUM',
      });
      score += 2;
    }

    // Content length (7 points)
    const wordCount = this.countWords(content);
    if (wordCount >= 500 && wordCount <= 2000) {
      score += 7;
    } else if (wordCount < 300) {
      improvements.push({
        category: 'Structure',
        description: 'Expand content to at least 500 words for comprehensive coverage',
        impact: 'HIGH',
      });
      score += 2;
    } else if (wordCount > 2500) {
      improvements.push({
        category: 'Structure',
        description: 'Consider breaking very long content into multiple focused pieces',
        impact: 'LOW',
      });
      score += 5;
    }

    // Has schema.org potential (5 points)
    const hasSchemaMarkup = content.includes('itemscope') || content.includes('itemtype');
    if (hasSchemaMarkup) {
      score += 5;
    } else {
      improvements.push({
        category: 'Structure',
        description: 'Add Schema.org markup (Article, FAQPage, or HowTo) for better AI understanding',
        impact: 'HIGH',
      });
    }

    return Math.min(score, 30);
  }

  /**
   * Calculate quality score (25 points max)
   * Evaluates: depth, examples, data, citations, freshness
   */
  private calculateQualityScore(content: string, improvements: Improvement[]): number {
    let score = 0;
    const text = this.extractText(content);
    const doc = compromise(text);

    // Has specific examples (5 points)
    const hasExamples = text.toLowerCase().includes('example') ||
                       text.toLowerCase().includes('for instance') ||
                       text.toLowerCase().includes('such as');
    if (hasExamples) {
      score += 5;
    } else {
      improvements.push({
        category: 'Quality',
        description: 'Add concrete examples to illustrate key points',
        impact: 'HIGH',
      });
    }

    // Has data/statistics (5 points)
    const numbers = doc.numbers().out('array');
    const percentages = text.match(/\d+%/g) || [];
    if (numbers.length >= 3 || percentages.length >= 2) {
      score += 5;
    } else {
      improvements.push({
        category: 'Quality',
        description: 'Include statistics, data points, or quantifiable information',
        impact: 'MEDIUM',
      });
    }

    // Has citations/sources (5 points)
    const hasCitations = text.includes('according to') ||
                        text.includes('research shows') ||
                        text.includes('study found') ||
                        content.includes('<cite>') ||
                        content.includes('[source');
    if (hasCitations) {
      score += 5;
    } else {
      improvements.push({
        category: 'Quality',
        description: 'Add credible sources and citations to support claims',
        impact: 'HIGH',
      });
    }

    // Depth of coverage (5 points)
    const uniqueConcepts = doc.topics().out('array');
    if (uniqueConcepts.length >= 5) {
      score += 5;
    } else {
      improvements.push({
        category: 'Quality',
        description: 'Expand topic coverage to address more related concepts',
        impact: 'MEDIUM',
      });
      score += 2;
    }

    // Freshness indicators (5 points)
    const currentYear = new Date().getFullYear();
    const hasFreshness = text.includes(currentYear.toString()) ||
                        text.includes((currentYear - 1).toString()) ||
                        text.toLowerCase().includes('latest') ||
                        text.toLowerCase().includes('recent');
    if (hasFreshness) {
      score += 5;
    } else {
      improvements.push({
        category: 'Quality',
        description: 'Add recent data or timestamps to show content freshness',
        impact: 'MEDIUM',
      });
    }

    return Math.min(score, 25);
  }

  /**
   * Calculate platform-specific score (25 points max)
   * Different optimization strategies for each AI platform
   */
  private calculatePlatformScore(content: string, platform: AIPlatform, improvements: Improvement[]): number {
    switch (platform) {
      case 'CHATGPT':
        return this.scoreChatGPT(content, improvements);
      case 'CLAUDE':
        return this.scoreClaude(content, improvements);
      case 'PERPLEXITY':
        return this.scorePerplexity(content, improvements);
      case 'GEMINI':
        return this.scoreGemini(content, improvements);
      case 'BING':
        return this.scoreBing(content, improvements);
      default:
        return 0;
    }
  }

  /**
   * ChatGPT optimization (structure + examples + clarity)
   */
  private scoreChatGPT(content: string, improvements: Improvement[]): number {
    let score = 0;
    const text = this.extractText(content);

    // Step-by-step instructions (8 points)
    const hasSteps = /step \d|first,|second,|finally,|\d\./gi.test(text);
    if (hasSteps) {
      score += 8;
    } else {
      improvements.push({
        category: 'ChatGPT',
        description: 'Add step-by-step instructions or numbered processes',
        impact: 'HIGH',
      });
    }

    // Clear definitions (7 points)
    const hasDefinitions = text.includes(' is ') || text.includes(' means ') || text.includes(' refers to ');
    if (hasDefinitions) {
      score += 7;
    } else {
      improvements.push({
        category: 'ChatGPT',
        description: 'Include clear definitions of key terms',
        impact: 'MEDIUM',
      });
    }

    // Practical examples (10 points)
    const exampleCount = (text.match(/example|for instance|such as/gi) || []).length;
    if (exampleCount >= 3) {
      score += 10;
    } else if (exampleCount >= 1) {
      score += 5;
    } else {
      improvements.push({
        category: 'ChatGPT',
        description: 'Add multiple practical examples (aim for 3+)',
        impact: 'HIGH',
      });
    }

    return Math.min(score, 25);
  }

  /**
   * Claude optimization (depth + context + nuance)
   */
  private scoreClaude(content: string, improvements: Improvement[]): number {
    let score = 0;
    const text = this.extractText(content);
    const wordCount = this.countWords(content);

    // Comprehensive depth (10 points)
    if (wordCount >= 800) {
      score += 10;
    } else {
      improvements.push({
        category: 'Claude',
        description: 'Expand content to 800+ words for comprehensive depth',
        impact: 'HIGH',
      });
      score += (wordCount / 800) * 10;
    }

    // Contextual background (8 points)
    const hasContext = text.toLowerCase().includes('background') ||
                      text.toLowerCase().includes('context') ||
                      text.toLowerCase().includes('historically');
    if (hasContext) {
      score += 8;
    } else {
      improvements.push({
        category: 'Claude',
        description: 'Add contextual background information',
        impact: 'MEDIUM',
      });
    }

    // Nuanced analysis (7 points)
    const hasNuance = text.includes('however') ||
                     text.includes('although') ||
                     text.includes('on the other hand');
    if (hasNuance) {
      score += 7;
    } else {
      improvements.push({
        category: 'Claude',
        description: 'Include nuanced analysis with multiple perspectives',
        impact: 'MEDIUM',
      });
    }

    return Math.min(score, 25);
  }

  /**
   * Perplexity optimization (citations + sources + data)
   */
  private scorePerplexity(content: string, improvements: Improvement[]): number {
    let score = 0;
    const text = this.extractText(content);

    // Multiple sources (10 points)
    const citationCount = (text.match(/according to|source:|study|research|report/gi) || []).length;
    if (citationCount >= 5) {
      score += 10;
    } else if (citationCount >= 2) {
      score += 5;
    } else {
      improvements.push({
        category: 'Perplexity',
        description: 'Add multiple credible sources and citations (aim for 5+)',
        impact: 'HIGH',
      });
    }

    // Statistical data (8 points)
    const numbers = (text.match(/\d+%|\d+\.\d+|[\d,]+/g) || []).length;
    if (numbers >= 10) {
      score += 8;
    } else {
      improvements.push({
        category: 'Perplexity',
        description: 'Include more statistical data and quantifiable metrics',
        impact: 'HIGH',
      });
      score += (numbers / 10) * 8;
    }

    // Recent data (7 points)
    const currentYear = new Date().getFullYear();
    const hasRecentData = text.includes(currentYear.toString()) || text.includes((currentYear - 1).toString());
    if (hasRecentData) {
      score += 7;
    } else {
      improvements.push({
        category: 'Perplexity',
        description: 'Update with recent data and current year statistics',
        impact: 'MEDIUM',
      });
    }

    return Math.min(score, 25);
  }

  /**
   * Gemini optimization (multimedia + local + conversational)
   */
  private scoreGemini(content: string, improvements: Improvement[]): number {
    let score = 0;
    const $ = cheerio.load(content);
    const text = this.extractText(content);

    // Multimedia elements (10 points)
    const images = $('img').length;
    const videos = $('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length;
    if (images >= 2 || videos >= 1) {
      score += 10;
    } else {
      improvements.push({
        category: 'Gemini',
        description: 'Add images, infographics, or video content',
        impact: 'HIGH',
      });
    }

    // Conversational tone (8 points)
    const hasQuestions = (text.match(/\?/g) || []).length;
    const hasConversational = text.includes('you') || text.includes('your');
    if (hasQuestions >= 2 && hasConversational) {
      score += 8;
    } else {
      improvements.push({
        category: 'Gemini',
        description: 'Use more conversational tone with questions and direct address',
        impact: 'MEDIUM',
      });
    }

    // Local context (7 points)
    const hasLocal = text.toLowerCase().includes('near you') ||
                    text.toLowerCase().includes('in your area') ||
                    text.toLowerCase().includes('local');
    if (hasLocal) {
      score += 7;
    } else {
      improvements.push({
        category: 'Gemini',
        description: 'Add local context or location-specific information',
        impact: 'LOW',
      });
    }

    return Math.min(score, 25);
  }

  /**
   * Bing optimization (concise + authoritative + fresh)
   */
  private scoreBing(content: string, improvements: Improvement[]): number {
    let score = 0;
    const text = this.extractText(content);
    const wordCount = this.countWords(content);

    // Concise and direct (10 points)
    const $ = cheerio.load(content);
    const hasSummary = $('summary, .summary, #summary').length > 0 ||
                      text.toLowerCase().includes('summary:') ||
                      text.toLowerCase().includes('key takeaways:');
    if (hasSummary && wordCount >= 300 && wordCount <= 1200) {
      score += 10;
    } else {
      improvements.push({
        category: 'Bing',
        description: 'Add a concise summary section and keep content focused (300-1200 words)',
        impact: 'HIGH',
      });
      score += 3;
    }

    // Authoritative tone (8 points)
    const hasAuthority = text.includes('expert') ||
                        text.includes('professional') ||
                        text.includes('certified') ||
                        text.includes('official');
    if (hasAuthority) {
      score += 8;
    } else {
      improvements.push({
        category: 'Bing',
        description: 'Establish authority with credentials, certifications, or expert references',
        impact: 'MEDIUM',
      });
    }

    // Fresh content signals (7 points)
    const currentYear = new Date().getFullYear();
    const hasFreshness = text.includes('updated') ||
                        text.includes('latest') ||
                        text.includes(currentYear.toString());
    if (hasFreshness) {
      score += 7;
    } else {
      improvements.push({
        category: 'Bing',
        description: 'Add "Last Updated" date and current year information',
        impact: 'MEDIUM',
      });
    }

    return Math.min(score, 25);
  }

  /**
   * Calculate readability score (20 points max)
   */
  private calculateReadabilityScore(content: string, improvements: Improvement[]): number {
    let score = 0;
    const text = this.extractText(content);

    try {
      // Flesch Reading Ease (60-70 is ideal - grade 8-9)
      const fleschScore = fleschReadingEase(text);
      if (fleschScore >= 60 && fleschScore <= 70) {
        score += 10;
      } else if (fleschScore >= 50 && fleschScore <= 80) {
        score += 7;
      } else {
        improvements.push({
          category: 'Readability',
          description: `Adjust readability to grade 8-9 level (current Flesch score: ${fleschScore.toFixed(1)})`,
          impact: 'MEDIUM',
        });
        score += 3;
      }

      // Sentence length variety (10 points)
      const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      const avgSentenceLength = sentences.reduce((acc, s) => acc + s.split(' ').length, 0) / sentences.length;

      if (avgSentenceLength >= 10 && avgSentenceLength <= 20) {
        score += 10;
      } else {
        improvements.push({
          category: 'Readability',
          description: 'Vary sentence length (aim for 10-20 words average)',
          impact: 'LOW',
        });
        score += 5;
      }
    } catch (error) {
      // Fallback if readability calculation fails
      score += 10;
    }

    return Math.min(score, 20);
  }

  /**
   * Helper: Extract plain text from HTML
   */
  private extractText(content: string): string {
    const $ = cheerio.load(content);
    return $('body').text() || content;
  }

  /**
   * Helper: Count words in content
   */
  private countWords(content: string): number {
    const text = this.extractText(content);
    return this.tokenizer.tokenize(text).length;
  }
}

// Export singleton instance
export const aeoOptimizer = new AEOOptimizer();
