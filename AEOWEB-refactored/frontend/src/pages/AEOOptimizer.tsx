import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  ChartBarIcon,
  LightBulbIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

type AIPlatform = 'CHATGPT' | 'CLAUDE' | 'PERPLEXITY' | 'GEMINI' | 'BING';

interface Improvement {
  category: string;
  description: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface OptimizationResult {
  score: number;
  optimizedContent: string;
  improvements: Improvement[];
  platformTips: string[];
  breakdown: {
    structure: number;
    quality: number;
    platform: number;
    readability: number;
  };
}

const platforms: { value: AIPlatform; label: string; emoji: string }[] = [
  { value: 'CHATGPT', label: 'ChatGPT', emoji: '🤖' },
  { value: 'CLAUDE', label: 'Claude', emoji: '🧠' },
  { value: 'PERPLEXITY', label: 'Perplexity', emoji: '🔍' },
  { value: 'GEMINI', label: 'Gemini', emoji: '✨' },
  { value: 'BING', label: 'Bing Chat', emoji: '🌐' },
];

export default function AEOOptimizer() {
  const [content, setContent] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<AIPlatform>('CHATGPT');
  const [aiOptimize, setAiOptimize] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [showOptimized, setShowOptimized] = useState(false);

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('http://localhost:4002/optimize/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          platform: selectedPlatform,
          aiOptimize,
        }),
      });

      if (!response.ok) {
        throw new Error('Optimization failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success('Content optimized successfully!');
    },
    onError: () => {
      toast.error('Failed to optimize content');
    },
  });

  const handleOptimize = () => {
    if (content.length < 100) {
      toast.error('Content must be at least 100 characters long');
      return;
    }
    optimizeMutation.mutate();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-400 to-green-600';
    if (score >= 60) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <SparklesIcon className="w-8 h-8 mr-3 text-purple-600" />
            AEO Optimizer
          </h1>
          <p className="mt-2 text-gray-600">
            Analyze and optimize your content for AI search engines
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Content Input
              </h2>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your content here (minimum 100 characters)..."
                className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
              />

              <p className="mt-2 text-sm text-gray-500">
                {content.length} characters
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Optimization Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Platform
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {platforms.map((platform) => (
                      <button
                        key={platform.value}
                        onClick={() => setSelectedPlatform(platform.value)}
                        className={`px-4 py-3 rounded-lg font-medium transition-all ${
                          selectedPlatform === platform.value
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span className="mr-2">{platform.emoji}</span>
                        {platform.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="aiOptimize"
                    checked={aiOptimize}
                    onChange={(e) => setAiOptimize(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="aiOptimize" className="ml-2 text-sm text-gray-700">
                    Use AI to automatically optimize content (GPT-4/Claude)
                  </label>
                </div>

                <button
                  onClick={handleOptimize}
                  disabled={optimizeMutation.isPending || content.length < 100}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  {optimizeMutation.isPending ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-5 h-5 mr-2" />
                      Optimize Content
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <ChartBarIcon className="w-5 h-5 mr-2 text-purple-600" />
                      AEO Score
                    </h2>
                    <div className={`text-4xl font-bold ${getScoreColor(result.score)}`}>
                      {result.score.toFixed(0)}
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="space-y-3 mb-6">
                    {Object.entries(result.breakdown).map(([category, score]) => (
                      <div key={category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 capitalize">{category}</span>
                          <span className={`font-semibold ${getScoreColor(score)}`}>
                            {score.toFixed(0)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full bg-gradient-to-r ${getScoreGradient(score)} transition-all duration-500`}
                            style={{ width: `${(score / 30) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Improvements */}
                  {result.improvements.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <LightBulbIcon className="w-4 h-4 mr-2 text-yellow-500" />
                        Suggested Improvements
                      </h3>
                      <div className="space-y-2">
                        {result.improvements.map((improvement, index) => (
                          <div
                            key={index}
                            className="border-l-4 border-purple-500 pl-3 py-2"
                          >
                            <div className="flex items-start justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {improvement.category}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${getImpactColor(
                                  improvement.impact
                                )}`}
                              >
                                {improvement.impact}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {improvement.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Platform Tips */}
                  {result.platformTips.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        {selectedPlatform} Optimization Tips
                      </h3>
                      <ul className="space-y-2">
                        {result.platformTips.map((tip, index) => (
                          <li key={index} className="flex items-start text-sm text-gray-600">
                            <span className="text-purple-600 mr-2">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Optimized Content */}
            <AnimatePresence>
              {result && aiOptimize && result.optimizedContent !== content && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-xl shadow-sm p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      AI-Optimized Content
                    </h2>
                    <button
                      onClick={() => setShowOptimized(!showOptimized)}
                      className="text-sm text-purple-600 hover:text-purple-700"
                    >
                      {showOptimized ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {showOptimized && (
                    <div className="prose max-w-none">
                      <div
                        className="p-4 bg-gray-50 rounded-lg text-sm"
                        dangerouslySetInnerHTML={{ __html: result.optimizedContent }}
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(result.optimizedContent);
                          toast.success('Copied to clipboard!');
                        }}
                        className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        Copy Optimized Content
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
