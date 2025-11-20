import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles size={24} />
              <h3 className="font-serif text-xl font-bold">Hairwave</h3>
            </div>
            <p className="text-gray-300 text-sm">
              Beautiful Hair, Naturally Powered. Science-backed natural hair care solutions.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Products</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className="text-gray-300 hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/hair-quiz" className="text-gray-300 hover:text-white transition-colors">Find Your Match</Link></li>
              <li><Link to="/subscribe" className="text-gray-300 hover:text-white transition-colors">Subscribe & Save 15%</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Learn</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Ingredients Guide</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Clinical Studies</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Hair Care Tips</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">About Us</a></li>
              <li><Link to="/aeo-dashboard" className="text-gray-300 hover:text-white transition-colors">AEO Performance</Link></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-300">
          <p>© 2025 Hairwave. All rights reserved.</p>
          <p className="mt-2">Powered by AEOWEB-refactored | AI-Optimized Hair Care</p>
        </div>
      </div>
    </footer>
  );
}
