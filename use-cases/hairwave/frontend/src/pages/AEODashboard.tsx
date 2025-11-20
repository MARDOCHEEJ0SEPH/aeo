import { Target, TrendingUp, DollarSign, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AEODashboard() {
  const stats = [
    { label: 'Target Citation Rate', value: '20%', icon: Target, color: 'bg-primary' },
    { label: 'Min AEO Score', value: '90', icon: TrendingUp, color: 'bg-secondary' },
    { label: 'MRR Goal', value: '$2.5M', icon: DollarSign, color: 'bg-accent' },
    { label: 'Subscription Rate', value: '65%', icon: Users, color: 'bg-green-500' },
  ];

  const platforms = [
    {
      name: 'CHATGPT',
      priority: 'high',
      style: 'how-to-guides',
      score: 93,
      color: 'bg-green-500',
    },
    {
      name: 'CLAUDE',
      priority: 'high',
      style: 'scientific-detailed',
      score: 90,
      color: 'bg-purple-500',
    },
    {
      name: 'PERPLEXITY',
      priority: 'high',
      style: 'evidence-based',
      score: 95,
      color: 'bg-blue-500',
    },
    {
      name: 'GEMINI',
      priority: 'high',
      style: 'visual-transformation',
      score: 91,
      color: 'bg-yellow-500',
    },
    {
      name: 'BING',
      priority: 'medium',
      style: 'quick-answers',
      score: 92,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-serif text-4xl font-bold mb-2">AEO Performance Dashboard</h1>
      <p className="text-gray-600 mb-8">Track Hairwave's AI Engine Optimization metrics</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-6"
          >
            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
              <stat.icon className="text-white" size={24} />
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="mb-12">
        <h2 className="font-serif text-3xl font-bold mb-6">Platform Scores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {platforms.map((platform) => (
            <div key={platform.name} className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 rounded-full ${platform.color}`} />
                <h3 className="font-semibold">{platform.name}</h3>
              </div>
              <div className="text-4xl font-bold text-primary mb-2">{platform.score}</div>
              <div className="text-sm text-gray-600 mb-3">{platform.style}</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${platform.color}`} style={{ width: `${platform.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-8">
        <h2 className="font-serif text-3xl font-bold mb-6">Business Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="text-sm text-gray-600 mb-2">Monthly Recurring Revenue</div>
            <div className="text-3xl font-bold text-primary mb-3">$2.5M</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '42%' }} />
            </div>
            <div className="text-sm text-gray-600 mt-2">42% to goal</div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-2">Customer LTV</div>
            <div className="text-3xl font-bold text-secondary mb-3">$450</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-secondary h-2 rounded-full" style={{ width: '90%' }} />
            </div>
            <div className="text-sm text-gray-600 mt-2">Target: $500</div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-2">Subscription Rate</div>
            <div className="text-3xl font-bold text-accent mb-3">65%</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-accent h-2 rounded-full" style={{ width: '65%' }} />
            </div>
            <div className="text-sm text-gray-600 mt-2">Industry avg: 35%</div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-2">Retention Rate</div>
            <div className="text-3xl font-bold text-green-600 mb-3">78%</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '78%' }} />
            </div>
            <div className="text-sm text-gray-600 mt-2">Target: 80%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
