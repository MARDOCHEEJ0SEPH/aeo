import { Link } from 'react-router-dom';
import { ShoppingCart, Sparkles } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function Header() {
  const itemCount = useCartStore((state) => state.itemCount());

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Sparkles className="text-primary" size={28} />
            <h1 className="text-2xl font-serif font-bold text-primary">Hairwave</h1>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/products" className="text-gray-700 hover:text-primary transition-colors">
              Products
            </Link>
            <Link to="/hair-quiz" className="text-gray-700 hover:text-primary transition-colors">
              Hair Quiz
            </Link>
            <Link to="/subscribe" className="text-gray-700 hover:text-primary transition-colors">
              Subscribe & Save
            </Link>
            <Link to="/aeo-dashboard" className="text-gray-700 hover:text-primary transition-colors">
              AEO Dashboard
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Link to="/cart" className="p-2 text-gray-700 hover:text-primary transition-colors relative">
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
