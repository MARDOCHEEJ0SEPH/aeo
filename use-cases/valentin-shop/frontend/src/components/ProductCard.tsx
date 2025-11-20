import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
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
      color: product.colors[0],
      size: product.sizes[0],
    });
  };

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/products/${product.id}`} className="card block group">
        {/* Image */}
        <div className="relative overflow-hidden aspect-[3/4]">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {discount > 0 && (
            <div className="absolute top-4 right-4 bg-secondary text-white px-3 py-1 rounded-full text-sm font-semibold">
              -{discount}%
            </div>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-semibold text-lg">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="text-sm text-gray-500 mb-1">{product.category}</div>
          <h3 className="font-serif font-semibold text-lg mb-2 line-clamp-1">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.shortDescription}
          </p>

          {/* Reviews */}
          <div className="flex items-center mb-3">
            <div className="flex items-center text-yellow-500">
              <Star size={16} fill="currentColor" />
              <span className="ml-1 text-sm text-gray-700">
                {product.reviews.average}
              </span>
            </div>
            <span className="ml-2 text-sm text-gray-500">
              ({product.reviews.count} reviews)
            </span>
          </div>

          {/* Price & CTA */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-primary">
                ${product.price}
              </span>
              {product.compareAtPrice && (
                <span className="ml-2 text-sm text-gray-500 line-through">
                  ${product.compareAtPrice}
                </span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="btn btn-primary text-sm px-4 py-2 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
