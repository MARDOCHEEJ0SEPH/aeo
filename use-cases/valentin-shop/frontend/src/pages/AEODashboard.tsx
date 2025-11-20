import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Eye, ShoppingCart, DollarSign, Target, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import AEOScoreCard from '@/components/AEOScoreCard';
import { analyticsService, contentService } from '@/services/aeoweb';

export default function AEODashboard() {
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => contentService.getAllProducts(),
  });

  const { data: metrics } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => analyticsService.getMetrics(),
  });

  // Calculate average AEO scores across all products
  const averageScores = products
    ? Object.keys(products[0]?.aeoOptimized || {}).reduce((acc, platform) => {
        const scores = products
          .map((p) => p.aeoOptimized[platform]?.score)
          .filter(Boolean);
        acc[platform] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        return acc;
      }, {} as Record<string, number>)
    : {};

  const stats = [
    {
      label: 'Total Products',
      value: products?.length || 0,
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      label: 'Average AEO Score',
      value: Object.values(averageScores).length
        ? Math.round(
            Object.values(averageScores).reduce((sum, score) => sum + score, 0) /
              Object.values(averageScores).length
          )
        : 0,
      icon: Target,
      color: 'bg-green-500',
    },
    {
      label: 'Target Revenue',
      value: '$500K',
      icon: DollarSign,
      color: 'bg-purple-500',
    },
    {
      label: 'Citation Rate',
      value: '15%',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-serif text-4xl font-bold mb-2">AEO Dashboard</h1>
        <p className="text-gray-600">
          Track your AI Engine Optimization performance across all major platforms
        </p>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Platform Scores */}
      <div className="mb-12">
        <h2 className="font-serif text-3xl font-bold mb-6">Platform Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {Object.entries(averageScores).map(([platform, score]) => (
            <AEOScoreCard
              key={platform}
              platform={platform}
              score={Math.round(score)}
              lastOptimized={new Date().toISOString()}
            />
          ))}
        </div>
      </div>

      {/* Platform Strategy */}
      <div className="mb-12">
        <h2 className="font-serif text-3xl font-bold mb-6">Platform Strategy</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <h3 className="font-semibold text-xl">ChatGPT</h3>
              <span className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                High Priority
              </span>
            </div>
            <p className="text-gray-600 mb-3">
              <strong>Style:</strong> Conversational
            </p>
            <p className="text-gray-700">
              Focus on easy-to-read product descriptions with clear benefits and usage scenarios.
              Perfect for customers asking "how to" questions.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <h3 className="font-semibold text-xl">Claude</h3>
              <span className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                High Priority
              </span>
            </div>
            <p className="text-gray-600 mb-3">
              <strong>Style:</strong> Detailed & Comprehensive
            </p>
            <p className="text-gray-700">
              In-depth product analysis with design philosophy, craftsmanship details, and
              versatility information. Ideal for research-focused queries.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <h3 className="font-semibold text-xl">Perplexity</h3>
              <span className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                High Priority
              </span>
            </div>
            <p className="text-gray-600 mb-3">
              <strong>Style:</strong> Data-Driven
            </p>
            <p className="text-gray-700">
              Specification-heavy content with customer reviews, ratings, and expert
              endorsements. Citations and statistics are key.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <h3 className="font-semibold text-xl">Gemini</h3>
              <span className="ml-auto px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                Medium Priority
              </span>
            </div>
            <p className="text-gray-600 mb-3">
              <strong>Style:</strong> Visual
            </p>
            <p className="text-gray-700">
              Image-rich descriptions with styling guides and visual examples. Great for
              inspiration and "how it looks" queries.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-6 lg:col-span-2"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <h3 className="font-semibold text-xl">Bing</h3>
              <span className="ml-auto px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                Medium Priority
              </span>
            </div>
            <p className="text-gray-600 mb-3">
              <strong>Style:</strong> Concise
            </p>
            <p className="text-gray-700">
              Quick, authoritative answers with pricing, availability, and direct purchase
              links. Optimized for transactional intent.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Business Metrics */}
      <div className="mb-12">
        <h2 className="font-serif text-3xl font-bold mb-6">Business Goals</h2>
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="text-primary" size={24} />
                <h3 className="font-semibold text-lg">Revenue Goal</h3>
              </div>
              <div className="text-3xl font-bold text-primary mb-2">$500,000</div>
              <p className="text-gray-600 text-sm">Annual revenue from AI discovery</p>
              <div className="mt-4 bg-gray-200 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '35%' }} />
              </div>
              <p className="text-sm text-gray-600 mt-2">35% to goal</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="text-secondary" size={24} />
                <h3 className="font-semibold text-lg">Conversion Target</h3>
              </div>
              <div className="text-3xl font-bold text-secondary mb-2">8%</div>
              <p className="text-gray-600 text-sm">AI-driven traffic conversion</p>
              <div className="mt-4 bg-gray-200 rounded-full h-2">
                <div className="bg-secondary h-2 rounded-full" style={{ width: '75%' }} />
              </div>
              <p className="text-sm text-gray-600 mt-2">Currently at 6%</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="text-green-600" size={24} />
                <h3 className="font-semibold text-lg">Average Order Value</h3>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">$175</div>
              <p className="text-gray-600 text-sm">Target per transaction</p>
              <div className="mt-4 bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '88%' }} />
              </div>
              <p className="text-sm text-gray-600 mt-2">Currently at $154</p>
            </div>
          </div>
        </div>
      </div>

      {/* Powered By */}
      <div className="text-center py-8 border-t">
        <p className="text-gray-600">
          Powered by <strong className="text-primary">AEOWEB-refactored</strong> | AI-Optimized E-Commerce Platform
        </p>
      </div>
    </div>
  );
}
