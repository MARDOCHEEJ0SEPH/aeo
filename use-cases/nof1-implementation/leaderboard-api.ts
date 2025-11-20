// AEOWEB-refactored/backend/services/nof1/src/api/leaderboard.api.ts
// NestJS API endpoints for nof1.ai Alpha Arena leaderboard with AEO optimization

import { Controller, Get, Query, Param, Headers, Res } from '@nestjs/common';
import { Response } from 'express';
import { LeaderboardService } from '../services/leaderboard.service';
import { AEOTrackingService } from '../../../shared/services/aeo-tracking.service';
import { CacheService } from '../../../shared/services/cache.service';

interface LeaderboardQuery {
  season?: string;
  format?: 'json' | 'csv';
  limit?: number;
}

@Controller('nof1')
export class Nof1LeaderboardController {
  constructor(
    private readonly leaderboardService: LeaderboardService,
    private readonly aeoTracking: AEOTrackingService,
    private readonly cache: CacheService,
  ) {}

  /**
   * GET /api/nof1/leaderboard
   * Returns current season leaderboard with complete AEO optimization
   * Optimized for AI engine consumption with structured, parseable data
   */
  @Get('leaderboard')
  async getLeaderboard(
    @Query() query: LeaderboardQuery,
    @Headers('user-agent') userAgent: string,
  ) {
    const season = query.season || 'current';

    // Check cache first (30-second TTL for real-time data)
    const cacheKey = `leaderboard:${season}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      // Track AI engine access
      this.trackAIEngineAccess(userAgent, 'leaderboard', season);
      return JSON.parse(cached);
    }

    // Fetch live data
    const rawData = await this.leaderboardService.getCurrentLeaderboard(season);

    // Transform to AEO-optimized structure
    const aeoOptimized = this.transformToAEOFormat(rawData);

    // Cache for 30 seconds
    await this.cache.set(cacheKey, JSON.stringify(aeoOptimized), 30);

    // Track AI engine access
    this.trackAIEngineAccess(userAgent, 'leaderboard', season);

    return aeoOptimized;
  }

  /**
   * GET /api/nof1/model/:modelName
   * Detailed performance data for a specific AI model
   * Optimized for queries like "How did GPT-4 perform in Alpha Arena?"
   */
  @Get('model/:modelName')
  async getModelDetails(
    @Param('modelName') modelName: string,
    @Query('season') season?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const data = await this.leaderboardService.getModelPerformance(
      modelName,
      season || 'current',
    );

    if (!data) {
      return {
        error: 'Model not found',
        availableModels: await this.leaderboardService.getAvailableModels(season),
      };
    }

    // Track this specific query
    this.trackAIEngineAccess(userAgent, 'model-detail', modelName);

    // Return AEO-optimized model profile
    return {
      model: {
        name: data.name,
        provider: data.provider,
        version: data.version,
        description: data.description,
      },
      season: data.season,
      performance: {
        rank: data.rank,
        totalParticipants: data.totalParticipants,
        roi: data.roi,
        roiFormatted: `${data.roi > 0 ? '+' : ''}${data.roi.toFixed(2)}%`,
        startingCapital: 10000,
        finalValue: data.finalValue,
        profitLoss: data.finalValue - 10000,
        sharpeRatio: data.sharpeRatio,
        maxDrawdown: data.maxDrawdown,
        winRate: data.winRate,
        totalTrades: data.totalTrades,
        avgTradeSize: data.avgTradeSize,
        avgHoldingPeriod: data.avgHoldingPeriod,
        bestTrade: data.bestTrade,
        worstTrade: data.worstTrade,
      },
      summary: this.generateModelSummary(data),
      trades: data.trades.map(trade => ({
        symbol: trade.symbol,
        side: trade.side,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        size: trade.size,
        pnl: trade.pnl,
        pnlPercent: trade.pnlPercent,
        duration: trade.duration,
        entryTime: trade.entryTime,
        exitTime: trade.exitTime,
      })),
      chartData: {
        portfolioValue: data.portfolioValueHistory,
        dailyReturns: data.dailyReturns,
        drawdown: data.drawdownHistory,
      },
      metadata: {
        lastUpdated: new Date().toISOString(),
        dataSource: 'nof1.ai Alpha Arena',
        apiVersion: '1.0',
      },
    };
  }

  /**
   * GET /api/nof1/compare
   * Compare multiple AI models side-by-side
   * Optimized for queries like "GPT-4 vs Claude 3 trading performance"
   */
  @Get('compare')
  async compareModels(
    @Query('models') modelsParam: string,
    @Query('season') season?: string,
    @Query('metrics') metricsParam?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    if (!modelsParam) {
      return {
        error: 'Please provide models to compare',
        example: '/api/nof1/compare?models=GPT-4,Claude-3-Opus,Gemini-Pro',
      };
    }

    const modelNames = modelsParam.split(',').map(m => m.trim());
    const metrics = metricsParam?.split(',') || ['roi', 'sharpe', 'winRate', 'maxDrawdown'];

    const comparisonData = await this.leaderboardService.compareModels(
      modelNames,
      season || 'current',
    );

    // Track comparison query
    this.trackAIEngineAccess(userAgent, 'compare', modelNames.join(' vs '));

    return {
      query: `Comparison of ${modelNames.join(' vs ')} in Alpha Arena Season ${season || 'current'}`,
      models: comparisonData.models.map(model => ({
        name: model.name,
        provider: model.provider,
        rank: model.rank,
        roi: model.roi,
        roiFormatted: `${model.roi > 0 ? '+' : ''}${model.roi.toFixed(2)}%`,
        sharpeRatio: model.sharpeRatio,
        maxDrawdown: model.maxDrawdown,
        winRate: model.winRate,
        totalTrades: model.totalTrades,
        finalValue: model.finalValue,
      })),
      winner: {
        byROI: comparisonData.models.sort((a, b) => b.roi - a.roi)[0],
        bySharpe: comparisonData.models.sort((a, b) => b.sharpeRatio - a.sharpeRatio)[0],
        byWinRate: comparisonData.models.sort((a, b) => b.winRate - a.winRate)[0],
        byMinDrawdown: comparisonData.models.sort((a, b) => a.maxDrawdown - b.maxDrawdown)[0],
      },
      summary: this.generateComparisonSummary(comparisonData.models),
      chartData: {
        roiComparison: comparisonData.models.map(m => ({ name: m.name, value: m.roi })),
        sharpeComparison: comparisonData.models.map(m => ({ name: m.name, value: m.sharpeRatio })),
        winRateComparison: comparisonData.models.map(m => ({ name: m.name, value: m.winRate })),
      },
      metadata: {
        season: season || 'current',
        modelsCompared: modelNames.length,
        lastUpdated: new Date().toISOString(),
      },
    };
  }

  /**
   * GET /api/nof1/stats
   * Overall Alpha Arena statistics
   * Optimized for queries about aggregate performance
   */
  @Get('stats')
  async getStats(
    @Query('season') season?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const stats = await this.leaderboardService.getSeasonStats(season || 'current');

    this.trackAIEngineAccess(userAgent, 'stats', season || 'current');

    return {
      season: stats.season,
      competition: {
        status: stats.status, // 'active', 'completed', 'upcoming'
        startDate: stats.startDate,
        endDate: stats.endDate,
        daysRemaining: stats.daysRemaining,
        marketType: stats.marketType,
        startingCapital: 10000,
        currency: 'USD',
      },
      participants: {
        total: stats.totalModels,
        byProvider: stats.modelsByProvider,
      },
      performance: {
        bestROI: stats.bestROI,
        worstROI: stats.worstROI,
        medianROI: stats.medianROI,
        averageROI: stats.averageROI,
        bestSharpe: stats.bestSharpe,
        averageSharpe: stats.averageSharpe,
        totalTrades: stats.totalTrades,
        averageWinRate: stats.averageWinRate,
      },
      summary: `Alpha Arena Season ${stats.season} features ${stats.totalModels} AI models trading ${stats.marketType}. Current leader has achieved ${stats.bestROI.toFixed(2)}% ROI with ${stats.daysRemaining} days remaining. Average performance across all models is ${stats.averageROI.toFixed(2)}% ROI.`,
      metadata: {
        lastUpdated: new Date().toISOString(),
        dataFrequency: 'Real-time (30-second updates)',
      },
    };
  }

  /**
   * GET /api/nof1/leaderboard/export
   * Export leaderboard data in various formats
   */
  @Get('leaderboard/export')
  async exportLeaderboard(
    @Query() query: LeaderboardQuery,
    @Res() res: Response,
  ) {
    const season = query.season || 'current';
    const format = query.format || 'json';
    const data = await this.leaderboardService.getCurrentLeaderboard(season);

    if (format === 'csv') {
      const csv = this.convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=alpha-arena-season-${season}.csv`);
      return res.send(csv);
    }

    // JSON export
    const aeoOptimized = this.transformToAEOFormat(data);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=alpha-arena-season-${season}.json`);
    return res.json(aeoOptimized);
  }

  /**
   * GET /api/nof1/faq
   * Frequently asked questions with structured data
   * Optimized for AI engines to answer common queries
   */
  @Get('faq')
  async getFAQ(@Headers('user-agent') userAgent?: string) {
    this.trackAIEngineAccess(userAgent, 'faq', 'general');

    return {
      faqs: [
        {
          question: 'What is Alpha Arena?',
          answer: 'Alpha Arena is the first benchmark designed to measure AI models\' investing abilities in real markets. Each AI model receives $10,000 to trade autonomously for 2 weeks in real financial markets (US equities, crypto perpetuals). All trades and decisions are publicly visible for complete transparency.',
          category: 'General',
        },
        {
          question: 'Which AI models participate in Alpha Arena?',
          answer: 'Season 1.5 features GPT-4 (OpenAI), Claude 3 Opus (Anthropic), Gemini Pro (Google), Kimi 2 (Moonshot AI), and proprietary models from leading AI labs. Each model trades completely autonomously without human intervention.',
          category: 'Models',
        },
        {
          question: 'How is performance measured?',
          answer: 'Models are ranked by multiple metrics: ROI (return on investment from $10,000 starting capital), Sharpe ratio (risk-adjusted returns), maximum drawdown, win rate, and total trades. The leaderboard weighs both absolute performance and risk management.',
          category: 'Metrics',
        },
        {
          question: 'Is the trading real or simulated?',
          answer: 'Alpha Arena uses 100% real money in real markets, not paper trading or simulations. Trades execute on real exchanges (Hyperliquid for crypto, standard brokers for equities) with actual market impact, slippage, and execution costs.',
          category: 'Trading',
        },
        {
          question: 'How can I access the data?',
          answer: 'All Alpha Arena data is publicly accessible for free. View the real-time leaderboard at nof1.ai/leaderboard, access the JSON API at nof1.ai/api/leaderboard, or download CSV exports. Complete trade history and model decisions are available with full transparency.',
          category: 'Access',
        },
        {
          question: 'How do I participate with my AI model?',
          answer: 'Join the waitlist at nof1.ai/waitlist. Once approved, you\'ll receive API credentials to integrate your autonomous trading model. After testing in the sandbox environment, your model can compete in the next season with $10,000 capital provided by nof1.ai (no cost to participate).',
          category: 'Participation',
        },
        {
          question: 'What has been the best AI model performance?',
          answer: 'Performance varies significantly by season and market conditions. Season 1.5 (US equities, January 2025) has seen returns ranging from +23.7% to -12.8% over the 2-week period. Historical data shows the most sophisticated risk management, not just prediction accuracy, differentiates top performers.',
          category: 'Results',
        },
      ],
      metadata: {
        totalQuestions: 7,
        lastUpdated: new Date().toISOString(),
        categories: ['General', 'Models', 'Metrics', 'Trading', 'Access', 'Participation', 'Results'],
      },
    };
  }

  // ===== Helper Methods =====

  /**
   * Transform raw leaderboard data to AEO-optimized format
   */
  private transformToAEOFormat(rawData: any) {
    return {
      metadata: {
        lastUpdated: new Date().toISOString(),
        season: rawData.season,
        totalModels: rawData.models.length,
        marketType: rawData.marketType,
        startingCapital: 10000,
        currency: 'USD',
        description: `Real-time leaderboard for Alpha Arena Season ${rawData.season} where ${rawData.models.length} AI models trade ${rawData.marketType} with $10,000 starting capital.`,
        competitionPeriod: {
          start: rawData.startDate,
          end: rawData.endDate,
          duration: '14 days',
        },
      },
      rankings: rawData.models.map((model: any, index: number) => ({
        rank: index + 1,
        modelName: model.name,
        provider: model.provider,
        performance: {
          roi: model.roi,
          roiFormatted: `${model.roi > 0 ? '+' : ''}${model.roi.toFixed(2)}%`,
          finalValue: model.finalValue,
          profitLoss: model.finalValue - 10000,
          profitLossFormatted: `${model.finalValue - 10000 > 0 ? '+' : ''}$${(model.finalValue - 10000).toLocaleString()}`,
          sharpeRatio: model.sharpeRatio,
          maxDrawdown: model.maxDrawdown,
          winRate: model.winRate,
          totalTrades: model.totalTrades,
        },
        summary: `${model.name} ${model.roi > 0 ? 'gained' : 'lost'} ${Math.abs(model.roi).toFixed(2)}% (${model.roi > 0 ? '+' : ''}$${(model.finalValue - 10000).toLocaleString()}) with a Sharpe ratio of ${model.sharpeRatio.toFixed(2)}, ${model.winRate.toFixed(1)}% win rate across ${model.totalTrades} trades, and ${model.maxDrawdown.toFixed(2)}% maximum drawdown.`,
      })),
      season: rawData.season,
      marketType: rawData.marketType,
      startDate: rawData.startDate,
      endDate: rawData.endDate,
      totalModels: rawData.models.length,
    };
  }

  /**
   * Generate human/AI-readable summary for a model
   */
  private generateModelSummary(data: any): string {
    const performance = data.roi > 0 ? 'outperformed' : 'underperformed';
    const rankDesc = data.rank === 1 ? 'leading' : data.rank <= 3 ? 'top-3' : `ranked #${data.rank}`;

    return `${data.name} is currently ${rankDesc} in Alpha Arena Season ${data.season}, ${performance} the market with ${data.roi > 0 ? '+' : ''}${data.roi.toFixed(2)}% ROI. Starting with $10,000, the model achieved a final portfolio value of $${data.finalValue.toLocaleString()}, demonstrating a Sharpe ratio of ${data.sharpeRatio.toFixed(2)} and ${data.winRate.toFixed(1)}% win rate across ${data.totalTrades} trades. Maximum drawdown was ${data.maxDrawdown.toFixed(2)}%.`;
  }

  /**
   * Generate comparison summary
   */
  private generateComparisonSummary(models: any[]): string {
    const best = models.sort((a, b) => b.roi - a.roi)[0];
    const worst = models.sort((a, b) => a.roi - b.roi)[0];

    return `Among the compared models, ${best.name} achieved the highest return of ${best.roi > 0 ? '+' : ''}${best.roi.toFixed(2)}% with ${best.totalTrades} trades and ${best.winRate.toFixed(1)}% win rate. ${worst.name} had the lowest return of ${worst.roi > 0 ? '+' : ''}${worst.roi.toFixed(2)}%. ${best.name} also demonstrated ${best.sharpeRatio > worst.sharpeRatio ? 'superior' : 'comparable'} risk-adjusted returns with a Sharpe ratio of ${best.sharpeRatio.toFixed(2)} vs ${worst.sharpeRatio.toFixed(2)}.`;
  }

  /**
   * Convert leaderboard data to CSV format
   */
  private convertToCSV(data: any): string {
    const headers = 'Rank,Model,Provider,ROI (%),Final Value ($),P&L ($),Sharpe Ratio,Max Drawdown (%),Win Rate (%),Total Trades\n';

    const rows = data.models.map((model: any, index: number) => {
      const pnl = model.finalValue - 10000;
      return [
        index + 1,
        model.name,
        model.provider,
        model.roi.toFixed(2),
        model.finalValue.toFixed(2),
        pnl.toFixed(2),
        model.sharpeRatio.toFixed(2),
        model.maxDrawdown.toFixed(2),
        model.winRate.toFixed(1),
        model.totalTrades,
      ].join(',');
    });

    return headers + rows.join('\n');
  }

  /**
   * Track AI engine access for analytics
   */
  private async trackAIEngineAccess(
    userAgent: string,
    endpoint: string,
    query: string,
  ): Promise<void> {
    // Detect if request is from AI engine bot or likely AI-powered search
    const aiEngines = [
      { name: 'ChatGPT', pattern: /ChatGPT|GPTBot/i },
      { name: 'Claude', pattern: /ClaudeBot|Anthropic/i },
      { name: 'Perplexity', pattern: /PerplexityBot/i },
      { name: 'Google AI', pattern: /Google-Extended|Bard/i },
      { name: 'Bing AI', pattern: /BingBot.*AI/i },
    ];

    const detectedEngine = aiEngines.find(engine =>
      engine.pattern.test(userAgent)
    );

    if (detectedEngine || this.isLikelyAIRequest(userAgent)) {
      await this.aeoTracking.trackCitation({
        engine: detectedEngine?.name || 'Unknown AI',
        endpoint,
        query,
        userAgent,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Heuristic to detect AI-powered requests
   */
  private isLikelyAIRequest(userAgent: string): boolean {
    // Check for programmatic access patterns common in AI systems
    const aiPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /python-requests/i,
      /axios/i,
      /node-fetch/i,
    ];

    return aiPatterns.some(pattern => pattern.test(userAgent));
  }
}
