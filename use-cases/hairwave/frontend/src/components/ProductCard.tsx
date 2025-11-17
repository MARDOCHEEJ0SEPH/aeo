import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Leaf } from 'lucide-react';
import { Product } from '@/services/aeoweb';
import { useCartStore } from '@/store/cartStore';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/products/${product.id}`} className="card block group">
        <div className="relative overflow-hidden aspect-square">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <span className="badge badge-success flex items-center gap-1">
              <Leaf size={14} />
              Natural
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="text-sm text-gray-500 mb-1">{product.category}</div>
          <h3 className="font-serif font-semibold text-lg mb-2 line-clamp-1">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.shortDescription}
          </p>

          <div className="flex items-center mb-3">
            <div className="flex items-center text-yellow-500">
              <Star size={16} fill="currentColor" />
              <span className="ml-1 text-sm text-gray-700">{product.reviews.average}</span>
            </div>
            <span className="ml-2 text-sm text-gray-500">({product.reviews.count})</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-primary">${product.price}</span>
              {product.compareAtPrice && (
                <span className="ml-2 text-sm text-gray-500 line-through">
                  ${product.compareAtPrice}
                </span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              className="btn btn-primary text-sm px-4 py-2 flex items-center space-x-2"
            >
              <ShoppingCart size={16} />
              <span>Add</span>
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
