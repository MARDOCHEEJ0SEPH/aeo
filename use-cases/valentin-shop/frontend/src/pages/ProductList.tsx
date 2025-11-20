import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, Grid, List } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { contentService } from '@/services/aeoweb';
import { motion } from 'framer-motion';

export default function ProductList() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: products, isLoading, error } = useQuery({
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
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <p className="text-red-600">Error loading products. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="font-serif text-4xl font-bold mb-2">Our Collection</h1>
        <p className="text-gray-600">
          Discover {filteredProducts.length} premium fashion & lifestyle products
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex flex-wrap gap-2">
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

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">
            <Filter size={20} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${
              viewMode === 'grid' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            <Grid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${
              viewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600">No products found in this category.</p>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'flex flex-col gap-6'
          }
        >
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
