import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6">
              Curated Fashion & Lifestyle
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Discover premium quality pieces that elevate your style
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/products" className="btn btn-secondary text-lg">
                Shop Collection
                <ArrowRight className="ml-2 inline" size={20} />
              </Link>
              <Link to="/aeo-dashboard" className="btn btn-outline bg-white text-primary border-white hover:bg-white/90 text-lg">
                View AEO Dashboard
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-accent">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="text-white" size={32} />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">AI-Optimized Discovery</h3>
              <p className="text-gray-600">
                Featured across ChatGPT, Claude, Perplexity, Gemini, and Bing for maximum visibility
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="text-white" size={32} />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Premium Quality</h3>
              <p className="text-gray-600">
                Carefully curated collection with 4.8/5 average rating from thousands of customers
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="text-white" size={32} />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Real-Time Analytics</h3>
              <p className="text-gray-600">
                Track product performance and AI discovery metrics through our AEO dashboard
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="font-serif text-4xl font-bold mb-6">
              Powered by AEOWEB-refactored
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Our platform uses cutting-edge AEO optimization to ensure every product is discoverable
              by AI assistants, driving 15% citation rate and 8% conversion from AI-driven traffic.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">$500K</div>
                <div className="text-sm text-gray-600">Annual Revenue Target</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">15%</div>
                <div className="text-sm text-gray-600">Citation Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">8%</div>
                <div className="text-sm text-gray-600">Conversion Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">50+</div>
                <div className="text-sm text-gray-600">AEO Products</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
