/**
 * Vercel Edge Function - AEO Score Calculator
 * Runs on the edge for ultra-low latency scoring
 */

import { NextRequest, NextResponse } from 'next/server';

export const config = {
  runtime: 'edge',
};

interface ScoreRequest {
  content: string;
  platform: 'CHATGPT' | 'CLAUDE' | 'PERPLEXITY' | 'GEMINI' | 'BING';
}

export default async function handler(req: NextRequest) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers });
  }

  if (req.method !== 'POST') {
    return new NextResponse(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  try {
    const body: ScoreRequest = await req.json();

    if (!body.content || !body.platform) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers }
      );
    }

    // Quick scoring algorithm (simplified for edge)
    const score = calculateQuickScore(body.content, body.platform);

    return new NextResponse(
      JSON.stringify({
        score,
        platform: body.platform,
        timestamp: new Date().toISOString(),
        edge: true,
      }),
      { status: 200, headers }
    );
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers }
    );
  }
}

/**
 * Quick AEO score calculation for edge runtime
 * (Simplified version - full scoring happens on backend)
 */
function calculateQuickScore(content: string, platform: string): number {
  let score = 0;

  // Word count (max 10 points)
  const wordCount = content.split(/\s+/).length;
  if (wordCount >= 500 && wordCount <= 2000) {
    score += 10;
  } else if (wordCount >= 300) {
    score += 5;
  }

  // Has headings (max 10 points)
  const headingMatches = content.match(/<h[1-6]>/gi) || [];
  if (headingMatches.length >= 3) {
    score += 10;
  } else if (headingMatches.length >= 1) {
    score += 5;
  }

  // Has lists (max 10 points)
  const listMatches = content.match(/<(ul|ol)>/gi) || [];
  if (listMatches.length >= 1) {
    score += 10;
  }

  // Has examples (max 10 points)
  const exampleKeywords = ['example', 'for instance', 'such as'];
  const hasExamples = exampleKeywords.some((keyword) =>
    content.toLowerCase().includes(keyword)
  );
  if (hasExamples) {
    score += 10;
  }

  // Has data/numbers (max 10 points)
  const numberMatches = content.match(/\d+(%|\.|\,)/g) || [];
  if (numberMatches.length >= 5) {
    score += 10;
  } else if (numberMatches.length >= 2) {
    score += 5;
  }

  // Platform-specific bonus (max 10 points)
  switch (platform) {
    case 'CHATGPT':
      if (content.includes('step') || content.match(/\d+\./g)) {
        score += 10;
      }
      break;
    case 'PERPLEXITY':
      if (content.includes('source') || content.includes('according to')) {
        score += 10;
      }
      break;
    case 'CLAUDE':
      if (wordCount >= 800) {
        score += 10;
      }
      break;
    case 'GEMINI':
      if (content.includes('<img') || content.includes('?')) {
        score += 10;
      }
      break;
    case 'BING':
      if (wordCount >= 300 && wordCount <= 1200) {
        score += 10;
      }
      break;
  }

  // Readability (max 30 points)
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLength = sentences.reduce((acc, s) => acc + s.split(/\s+/).length, 0) / sentences.length;
  if (avgSentenceLength >= 10 && avgSentenceLength <= 20) {
    score += 30;
  } else {
    score += 15;
  }

  return Math.min(score, 100);
}
