import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ProductCard from '@/components/ProductCard';
import { contentService } from '@/services/aeoweb';

export default function ProductList() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => contentService.getAllProducts(),
  });

  const categories = products
    ? ['all', ...new Set(products.map((p) => p.category))]
    : ['all'];

  const filteredProducts = products
    ? selectedCategory === 'all'
      ? products
      : products.filter((p) => p.category === selectedCategory)
    : [];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-serif text-4xl font-bold mb-2">Our Products</h1>
      <p className="text-gray-600 mb-8">Science-backed natural hair care solutions</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
