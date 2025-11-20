import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Award, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-br from-primary to-secondary text-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6">
              Beautiful Hair, Naturally Powered
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              Science-backed natural hair care with proven results. 92% see stronger hair in 4 weeks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/products" className="btn bg-white text-primary hover:bg-white/90 text-lg">
                Shop Products
                <ArrowRight className="ml-2 inline" size={20} />
              </Link>
              <Link to="/hair-quiz" className="btn btn-outline border-white text-white hover:bg-white hover:text-primary text-lg">
                Take Hair Quiz
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="text-white" size={32} />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">95% Natural Ingredients</h3>
              <p className="text-gray-600">No sulfates, parabens, or silicones. Cruelty-free & vegan.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="text-white" size={32} />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Clinically Tested</h3>
              <p className="text-gray-600">Dermatologist approved with published clinical studies.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="text-white" size={32} />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">Proven Results</h3>
              <p className="text-gray-600">92% see improved hair strength in just 4 weeks.</p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="font-serif text-4xl font-bold mb-6">Subscribe & Save 15%</h2>
            <p className="text-xl text-gray-600 mb-8">
              Get your favorite products delivered automatically and save on every order.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">$2.5M</div>
                <div className="text-sm text-gray-600">MRR Target</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">65%</div>
                <div className="text-sm text-gray-600">Subscription Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">78%</div>
                <div className="text-sm text-gray-600">Retention</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">$450</div>
                <div className="text-sm text-gray-600">Customer LTV</div>
              </div>
            </div>
            <Link to="/subscribe" className="btn btn-primary text-lg">
              Learn More About Subscriptions
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
