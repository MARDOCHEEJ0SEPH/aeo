import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  SparklesIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: SparklesIcon,
    title: 'AI-Powered Optimization',
    description: 'Optimize your content for ChatGPT, Claude, Perplexity, Gemini, and Bing Chat with advanced AEO algorithms.',
  },
  {
    icon: ChartBarIcon,
    title: 'Real-Time Analytics',
    description: 'Track citations, monitor performance, and measure visibility across all major AI platforms.',
  },
  {
    icon: RocketLaunchIcon,
    title: 'Content Generation',
    description: 'Generate AEO-optimized content using GPT-4 and Claude, tailored to each platform\'s preferences.',
  },
  {
    icon: CheckCircleIcon,
    title: 'Performance Scores',
    description: 'Get detailed scores for structure, quality, readability, and platform-specific optimization.',
  },
];

const platforms = [
  { name: 'ChatGPT', logo: '🤖', color: 'from-green-400 to-green-600' },
  { name: 'Claude', logo: '🧠', color: 'from-purple-400 to-purple-600' },
  { name: 'Perplexity', logo: '🔍', color: 'from-blue-400 to-blue-600' },
  { name: 'Gemini', logo: '✨', color: 'from-pink-400 to-pink-600' },
  { name: 'Bing', logo: '🌐', color: 'from-cyan-400 to-cyan-600' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Master{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                Answer Engine
              </span>
              {' '}Optimization
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Optimize your content for AI-powered search engines. Get discovered by ChatGPT, Claude, Perplexity, and more.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Get Started Free
              </Link>

              <Link
                to="/dashboard"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold text-lg hover:bg-white/20 transition-all border border-white/20"
              >
                View Dashboard
              </Link>
            </div>
          </motion.div>

          {/* Platform Icons */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-5 gap-4"
          >
            {platforms.map((platform, index) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className={`bg-gradient-to-br ${platform.color} rounded-xl p-6 text-center shadow-xl transform hover:scale-110 transition-transform`}
              >
                <div className="text-4xl mb-2">{platform.logo}</div>
                <div className="text-white font-semibold">{platform.name}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need for AEO Success
            </h2>
            <p className="text-xl text-gray-300">
              Comprehensive tools to optimize, track, and grow your AI visibility
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/10 hover:border-purple-500/50 transition-all"
              >
                <feature.icon className="w-12 h-12 text-purple-400 mb-4" />
                <h3 className="text-2xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-2">
                5
              </div>
              <div className="text-xl text-gray-300">AI Platforms Supported</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-2">
                100+
              </div>
              <div className="text-xl text-gray-300">Optimization Factors</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-2">
                Real-Time
              </div>
              <div className="text-xl text-gray-300">Performance Tracking</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Dominate AI Search?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of content creators optimizing for the future of search
            </p>
            <Link
              to="/register"
              className="inline-block px-10 py-5 bg-white text-purple-600 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
            >
              Start Optimizing Now
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
