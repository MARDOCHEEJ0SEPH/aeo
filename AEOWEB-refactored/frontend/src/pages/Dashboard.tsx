import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  ChartBarIcon,
  DocumentTextIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useWebSocket } from '../hooks/useWebSocket';

interface Content {
  id: string;
  title: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  contentType: string;
  createdAt: string;
  publishedAt?: string;
  aeoScores: Array<{
    platform: string;
    overallScore: number;
  }>;
}

interface DashboardStats {
  totalContent: number;
  publishedContent: number;
  avgAEOScore: number;
  totalCitations: number;
}

export default function Dashboard() {
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');
  const { connected, metrics } = useWebSocket();

  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/dashboard/overview', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  // Fetch content list
  const { data: contentList, isLoading } = useQuery<Content[]>({
    queryKey: ['content', filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter.toUpperCase());
      }

      const response = await fetch(`/api/content?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.json();
    },
  });

  const statCards = [
    {
      title: 'Total Content',
      value: stats?.totalContent || 0,
      icon: DocumentTextIcon,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Published',
      value: stats?.publishedContent || 0,
      icon: ChartBarIcon,
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Avg AEO Score',
      value: stats?.avgAEOScore?.toFixed(1) || '0.0',
      icon: SparklesIcon,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Total Citations',
      value: stats?.totalCitations || 0,
      icon: ChartBarIcon,
      color: 'from-pink-500 to-pink-600',
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PUBLISHED: 'bg-green-100 text-green-800',
      ARCHIVED: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                {connected ? (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    Live updates enabled
                  </span>
                ) : (
                  <span className="text-gray-400">Connecting...</span>
                )}
              </p>
            </div>

            <Link
              to="/content/new"
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              New Content
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Real-time Metrics (if connected) */}
        {connected && metrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 mb-8"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Real-Time Metrics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">CPU</p>
                <p className="text-xl font-semibold">{metrics.cpu?.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Memory</p>
                <p className="text-xl font-semibold">{metrics.memory?.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Requests</p>
                <p className="text-xl font-semibold">{metrics.requests}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Response Time</p>
                <p className="text-xl font-semibold">{metrics.responseTime}ms</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Content List */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Your Content
              </h2>

              <div className="flex gap-2">
                {(['all', 'draft', 'published'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === f
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {isLoading ? (
              <div className="p-12 text-center text-gray-500">
                Loading content...
              </div>
            ) : contentList && contentList.length > 0 ? (
              contentList.map((content) => {
                const avgScore = content.aeoScores.length > 0
                  ? content.aeoScores.reduce((acc, s) => acc + s.overallScore, 0) / content.aeoScores.length
                  : 0;

                return (
                  <Link
                    key={content.id}
                    to={`/content/${content.id}`}
                    className="block p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {content.title}
                          </h3>
                          {getStatusBadge(content.status)}
                        </div>

                        <p className="text-sm text-gray-500 mb-2">
                          {content.contentType} • Created{' '}
                          {new Date(content.createdAt).toLocaleDateString()}
                          {content.publishedAt && (
                            <> • Published {new Date(content.publishedAt).toLocaleDateString()}</>
                          )}
                        </p>

                        {content.aeoScores.length > 0 && (
                          <div className="flex gap-3 mt-3">
                            {content.aeoScores.map((score) => (
                              <div
                                key={score.platform}
                                className="text-xs"
                              >
                                <span className="text-gray-600">{score.platform}: </span>
                                <span className={`font-semibold ${getScoreColor(score.overallScore)}`}>
                                  {score.overallScore.toFixed(0)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {avgScore > 0 && (
                        <div className="ml-4 text-right">
                          <p className="text-sm text-gray-600">Avg Score</p>
                          <p className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
                            {avgScore.toFixed(0)}
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No content yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Create your first piece of AEO-optimized content
                </p>
                <Link
                  to="/content/new"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create Content
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
