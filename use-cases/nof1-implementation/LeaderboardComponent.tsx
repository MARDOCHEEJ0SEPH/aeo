// AEOWEB-refactored/frontend/src/components/Nof1/Leaderboard.tsx
// AEO-optimized leaderboard component for Alpha Arena

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SchemaMarkup } from '../AEO/SchemaMarkup';
import './Leaderboard.css';

interface ModelPerformance {
  rank: number;
  modelName: string;
  provider: string;
  roi: number;
  roiFormatted: string;
  finalValue: number;
  profitLoss: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  summary: string;
}

interface LeaderboardData {
  season: string;
  marketType: string;
  startDate: string;
  endDate: string;
  totalModels: number;
  rankings: ModelPerformance[];
  metadata: {
    lastUpdated: string;
    startingCapital: number;
    currency: string;
    description: string;
  };
}

export const Leaderboard: React.FC = () => {
  const { data, isLoading, error } = useQuery<LeaderboardData>({
    queryKey: ['nof1', 'leaderboard'],
    queryFn: () => fetch('/api/nof1/leaderboard').then(r => r.json()),
    refetchInterval: 30000, // Refresh every 30 seconds for real-time data
  });

  if (isLoading) {
    return <div className="loading">Loading real-time leaderboard...</div>;
  }

  if (error) {
    return <div className="error">Unable to load leaderboard. Please try again.</div>;
  }

  if (!data) return null;

  // Create Table schema for AI engines
  const tableSchema = {
    "@context": "https://schema.org",
    "@type": "Table",
    "about": `Alpha Arena Season ${data.season} AI Trading Leaderboard`,
    "description": data.metadata.description,
    "dateModified": data.metadata.lastUpdated,
  };

  // Create ItemList schema for rankings
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Alpha Arena Season ${data.season} Rankings`,
    "description": `Real-time rankings of ${data.totalModels} AI models trading with $${data.metadata.startingCapital} in ${data.marketType}`,
    "numberOfItems": data.totalModels,
    "itemListOrder": "https://schema.org/ItemListOrderDescending",
    "itemListElement": data.rankings.map((model, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": model.modelName,
      "description": model.summary,
      "item": {
        "@type": "SoftwareApplication",
        "name": model.modelName,
        "applicationCategory": "AI Trading Model",
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": model.sharpeRatio > 0 ? Math.min(5, 3 + model.sharpeRatio) : 1,
          "bestRating": 5,
          "worstRating": 1,
        }
      }
    }))
  };

  return (
    <div className="leaderboard-container">
      <SchemaMarkup schema={[tableSchema, itemListSchema]} />

      {/* Header with AEO-friendly content */}
      <header className="leaderboard-header">
        <h1>Alpha Arena Season {data.season} Leaderboard</h1>
        <p className="leaderboard-subtitle">
          {data.totalModels} AI models trading {data.marketType} with ${data.metadata.startingCapital.toLocaleString()} starting capital
        </p>
        <div className="leaderboard-meta">
          <span>Last Updated: {new Date(data.metadata.lastUpdated).toLocaleTimeString()}</span>
          <span className="live-indicator">
            <span className="live-dot"></span> LIVE
          </span>
        </div>
      </header>

      {/* Summary Stats - AI-friendly format */}
      <div className="summary-stats">
        <div className="stat-card">
          <h3>Best Performer</h3>
          <div className="stat-value">{data.rankings[0].modelName}</div>
          <div className="stat-detail">
            {data.rankings[0].roiFormatted} ROI
          </div>
        </div>

        <div className="stat-card">
          <h3>Total Trades</h3>
          <div className="stat-value">
            {data.rankings.reduce((sum, m) => sum + m.totalTrades, 0)}
          </div>
          <div className="stat-detail">
            Across all {data.totalModels} models
          </div>
        </div>

        <div className="stat-card">
          <h3>Avg Win Rate</h3>
          <div className="stat-value">
            {(data.rankings.reduce((sum, m) => sum + m.winRate, 0) / data.totalModels).toFixed(1)}%
          </div>
          <div className="stat-detail">
            Average across all models
          </div>
        </div>

        <div className="stat-card">
          <h3>Competition Period</h3>
          <div className="stat-value">14 Days</div>
          <div className="stat-detail">
            {new Date(data.startDate).toLocaleDateString()} - {new Date(data.endDate).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Main Leaderboard Table */}
      <div className="leaderboard-table-wrapper">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>AI Model</th>
              <th>Provider</th>
              <th>ROI</th>
              <th>Final Value</th>
              <th>P&L</th>
              <th>Sharpe Ratio</th>
              <th>Max Drawdown</th>
              <th>Win Rate</th>
              <th>Trades</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.rankings.map((model) => (
              <tr key={model.rank} className={model.rank <= 3 ? `rank-${model.rank}` : ''}>
                <td className="rank-cell">
                  {model.rank <= 3 && <span className="medal">🥇🥈🥉"[model.rank - 1]</span>}
                  <span className="rank-number">#{model.rank}</span>
                </td>
                <td className="model-name">
                  <strong>{model.modelName}</strong>
                </td>
                <td className="provider">{model.provider}</td>
                <td className={`roi ${model.roi > 0 ? 'positive' : 'negative'}`}>
                  {model.roiFormatted}
                </td>
                <td className="final-value">
                  ${model.finalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className={`pnl ${model.profitLoss > 0 ? 'positive' : 'negative'}`}>
                  {model.profitLoss > 0 ? '+' : ''}${model.profitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="sharpe">
                  {model.sharpeRatio.toFixed(2)}
                </td>
                <td className="drawdown">
                  {model.maxDrawdown.toFixed(2)}%
                </td>
                <td className="win-rate">
                  {model.winRate.toFixed(1)}%
                </td>
                <td className="trades">
                  {model.totalTrades}
                </td>
                <td>
                  <a href={`/models/${model.modelName.toLowerCase().replace(/\s+/g, '-')}`} className="view-details">
                    Details →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI-Friendly Summary Section */}
      <section className="aeo-summary">
        <h2>Season {data.season} Summary</h2>
        <div className="summary-content">
          <p>
            <strong>{data.rankings[0].modelName}</strong> leads the Alpha Arena Season {data.season}
            leaderboard with a {data.rankings[0].roiFormatted} return on investment, achieving a final
            portfolio value of ${data.rankings[0].finalValue.toLocaleString()} from the $10,000 starting
            capital. The model demonstrated strong risk-adjusted returns with a Sharpe ratio of{' '}
            {data.rankings[0].sharpeRatio.toFixed(2)} and maintained a {data.rankings[0].winRate.toFixed(1)}%
            win rate across {data.rankings[0].totalTrades} trades.
          </p>

          <p>
            The {data.totalModels} participating AI models traded {data.marketType} autonomously for 2 weeks,
            with performances ranging from {data.rankings[0].roiFormatted} (best) to{' '}
            {data.rankings[data.rankings.length - 1].roiFormatted} (worst). The median ROI was{' '}
            {data.rankings[Math.floor(data.rankings.length / 2)].roiFormatted}.
          </p>

          <p>
            All trades and positions are publicly visible for complete transparency. This benchmark provides
            objective measurement of AI models' investing capabilities in real market conditions.
          </p>
        </div>
      </section>

      {/* Export/Share Options */}
      <div className="leaderboard-actions">
        <button onClick={() => window.open('/api/nof1/leaderboard/export?format=json', '_blank')}>
          Export Data (JSON)
        </button>
        <button onClick={() => window.open('/api/nof1/leaderboard/export?format=csv', '_blank')}>
          Export Data (CSV)
        </button>
        <button onClick={() => navigator.share?.({
          title: `Alpha Arena Season ${data.season} Leaderboard`,
          text: `${data.rankings[0].modelName} leads with ${data.rankings[0].roiFormatted} ROI`,
          url: window.location.href
        })}>
          Share Results
        </button>
      </div>
    </div>
  );
};
