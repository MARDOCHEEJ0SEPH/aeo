import { motion } from 'framer-motion';
import { TrendingUp, Award, BarChart3 } from 'lucide-react';

interface AEOScoreCardProps {
  platform: string;
  score: number;
  lastOptimized: string;
}

export default function AEOScoreCard({ platform, score, lastOptimized }: AEOScoreCardProps) {
  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      CHATGPT: 'bg-green-500',
      CLAUDE: 'bg-purple-500',
      PERPLEXITY: 'bg-blue-500',
      GEMINI: 'bg-yellow-500',
      BING: 'bg-orange-500',
    };
    return colors[platform] || 'bg-gray-500';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${getPlatformColor(platform)}`} />
          <h3 className="font-semibold text-lg">{platform}</h3>
        </div>
        <Award className={getScoreColor(score)} size={24} />
      </div>

      <div className="mb-4">
        <div className="flex items-baseline space-x-2">
          <span className={`text-4xl font-bold ${getScoreColor(score)}`}>
            {score}
          </span>
          <span className="text-gray-500">/100</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">{getScoreLabel(score)}</p>
      </div>

      {/* Score Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`h-2 rounded-full ${getPlatformColor(platform)}`}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-1">
          <BarChart3 size={14} />
          <span>AEO Score</span>
        </div>
        <div className="flex items-center space-x-1">
          <TrendingUp size={14} />
          <span>Optimized {new Date(lastOptimized).toLocaleDateString()}</span>
        </div>
      </div>
    </motion.div>
  );
}
