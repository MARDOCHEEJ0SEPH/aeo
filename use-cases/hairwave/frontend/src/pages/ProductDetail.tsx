import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star, ShoppingCart, Leaf, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { contentService, analyticsService } from '@/services/aeoweb';
import { useCartStore } from '@/store/cartStore';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const [isSubscription, setIsSubscription] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const prod = await contentService.getProduct(id!);
      await analyticsService.trackProductView(id!);
      return prod;
    },
    enabled: !!id,
  });

  if (isLoading || !product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const effectivePrice = isSubscription ? product.price * 0.85 : product.price;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div>
          <div className="aspect-square mb-4 overflow-hidden rounded-lg">
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          </div>
        </div>

        <div>
          <h1 className="font-serif text-4xl font-bold mb-4">{product.name}</h1>

          <div className="flex items-center mb-6">
            <div className="flex items-center text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} fill={i < Math.round(product.reviews.average) ? 'currentColor' : 'none'} />
              ))}
            </div>
            <span className="ml-2 text-gray-700">{product.reviews.average} ({product.reviews.count} reviews)</span>
          </div>

          <div className="mb-6">
            <span className="text-4xl font-bold text-primary">${effectivePrice.toFixed(2)}</span>
            {isSubscription && (
              <span className="ml-2 text-sm text-green-600 font-semibold">Save 15%!</span>
            )}
          </div>

          <p className="text-gray-700 mb-6">{product.baseDescription}</p>

          <div className="mb-6">
            <label className="flex items-center gap-3 p-4 border-2 border-secondary rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={isSubscription}
                onChange={(e) => setIsSubscription(e.target.checked)}
                className="w-5 h-5"
              />
              <div>
                <div className="font-semibold">Subscribe & Save 15%</div>
                <div className="text-sm text-gray-600">Delivered monthly, cancel anytime</div>
              </div>
            </label>
          </div>

          <button
            onClick={() => addItem({
              id: product.id,
              name: product.name,
              price: effectivePrice,
              image: product.images[0],
              isSubscription,
            })}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <ShoppingCart size={20} />
            Add to Cart
          </button>

          <div className="mt-6 flex gap-3">
            <span className="badge badge-success flex items-center gap-1">
              <Leaf size={14} />
              95% Natural
            </span>
            <span className="badge badge-info flex items-center gap-1">
              <Award size={14} />
              Clinically Tested
            </span>
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div className="mb-16">
        <h2 className="font-serif text-3xl font-bold mb-6">Active Ingredients</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {product.ingredients.active.map((ingredient, index) => (
            <div key={index} className="card p-6">
              <h3 className="font-semibold text-lg mb-2">{ingredient.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{ingredient.concentration}</p>
              <p className="text-sm text-gray-700 mb-3">{ingredient.purpose}</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {ingredient.benefits.map((benefit, i) => (
                  <li key={i}>• {benefit}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Clinical Results */}
      <div className="mb-16">
        <h2 className="font-serif text-3xl font-bold mb-6">Clinical Study Results</h2>
        <div className="card p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{product.clinicalResults.studySize}</div>
              <div className="text-sm text-gray-600">Participants</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{product.clinicalResults.duration}</div>
              <div className="text-sm text-gray-600">Study Duration</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{product.clinicalResults.year}</div>
              <div className="text-sm text-gray-600">Year Published</div>
            </div>
          </div>

          <div className="space-y-4">
            {product.clinicalResults.results.map((result, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{result.metric}</span>
                  <span className="font-bold text-primary">{result.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${result.percentage}%` }} />
                </div>
                <p className="text-sm text-gray-600">{result.description}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-600 mt-6">
            Study conducted by {product.clinicalResults.institution}
          </p>
        </div>
      </div>
    </div>
  );
}
