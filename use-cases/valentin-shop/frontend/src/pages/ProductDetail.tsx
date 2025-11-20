import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star, ShoppingCart, Heart, Share2, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import AEOScoreCard from '@/components/AEOScoreCard';
import { contentService, analyticsService } from '@/services/aeoweb';
import { useCartStore } from '@/store/cartStore';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

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

  const handleAddToCart = () => {
    if (!product) return;

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[selectedImage],
      color: selectedColor || product.colors[0],
      size: selectedSize || product.sizes[0],
    });

    analyticsService.trackAddToCart(product.id, quantity);
  };

  if (isLoading || !product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!selectedColor) setSelectedColor(product.colors[0]);
  if (!selectedSize) setSelectedSize(product.sizes[0]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Images */}
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="aspect-[3/4] mb-4 overflow-hidden rounded-lg"
          >
            <img
              src={product.images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </motion.div>
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`aspect-square rounded-lg overflow-hidden border-2 ${
                  selectedImage === index ? 'border-primary' : 'border-transparent'
                }`}
              >
                <img src={image} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div>
          <div className="text-sm text-gray-500 mb-2">{product.category}</div>
          <h1 className="font-serif text-4xl font-bold mb-4">{product.name}</h1>

          {/* Reviews */}
          <div className="flex items-center mb-6">
            <div className="flex items-center text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  fill={i < Math.round(product.reviews.average) ? 'currentColor' : 'none'}
                />
              ))}
            </div>
            <span className="ml-2 text-gray-700">
              {product.reviews.average} ({product.reviews.count} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="mb-6">
            <span className="text-4xl font-bold text-primary">${product.price}</span>
            {product.compareAtPrice && (
              <span className="ml-4 text-xl text-gray-500 line-through">
                ${product.compareAtPrice}
              </span>
            )}
          </div>

          <p className="text-gray-700 mb-6">{product.baseDescription}</p>

          {/* Color Selection */}
          <div className="mb-6">
            <label className="block font-semibold mb-3">Color: {selectedColor}</label>
            <div className="flex gap-3">
              {product.colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    selectedColor === color
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 hover:border-primary'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Size Selection */}
          <div className="mb-6">
            <label className="block font-semibold mb-3">Size: {selectedSize}</label>
            <div className="flex gap-3">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-lg border-2 min-w-[60px] ${
                    selectedSize === size
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 hover:border-primary'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <label className="block font-semibold mb-3">Quantity</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-lg border border-gray-300 hover:border-primary"
              >
                -
              </button>
              <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.inventory, quantity + 1))}
                className="w-10 h-10 rounded-lg border border-gray-300 hover:border-primary"
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="btn btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <ShoppingCart size={20} />
              Add to Cart
            </button>
            <button className="btn btn-outline p-3">
              <Heart size={20} />
            </button>
            <button className="btn btn-outline p-3">
              <Share2 size={20} />
            </button>
          </div>

          {/* Features */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3">Features</h3>
            <ul className="space-y-2">
              {product.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* AEO Scores */}
      <div className="mb-16">
        <h2 className="font-serif text-3xl font-bold mb-6">AI Platform Optimization Scores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {Object.entries(product.aeoOptimized).map(([platform, data]) => (
            <AEOScoreCard
              key={platform}
              platform={platform}
              score={data.score}
              lastOptimized={data.lastOptimized}
            />
          ))}
        </div>
      </div>

      {/* Platform-Specific Content */}
      <div className="mb-16">
        <h2 className="font-serif text-3xl font-bold mb-6">Platform-Optimized Content</h2>
        <div className="space-y-6">
          {Object.entries(product.aeoOptimized).map(([platform, data]) => (
            <div key={platform} className="card p-6">
              <h3 className="font-semibold text-xl mb-3">{platform}</h3>
              <h4 className="text-lg mb-2">{data.title}</h4>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: data.content }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
