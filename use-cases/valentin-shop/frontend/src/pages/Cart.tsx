import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';

export default function Cart() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto"
        >
          <ShoppingBag size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="font-serif text-3xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">
            Discover our collection and add some items to your cart
          </p>
          <Link to="/products" className="btn btn-primary">
            Browse Products
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-serif text-4xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="card p-4 flex gap-4"
              >
                {/* Image */}
                <div className="w-24 h-24 flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>

                {/* Details */}
                <div className="flex-grow">
                  <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                  <div className="text-sm text-gray-600 mb-2">
                    {item.color && <span>Color: {item.color}</span>}
                    {item.size && <span className="ml-4">Size: {item.size}</span>}
                  </div>
                  <div className="text-lg font-bold text-primary">${item.price}</div>
                </div>

                {/* Quantity Controls */}
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <Trash2 size={20} />
                  </button>

                  <div className="flex items-center gap-2 border rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 hover:bg-gray-100 rounded-l-lg"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-12 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 hover:bg-gray-100 rounded-r-lg"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <button
            onClick={clearCart}
            className="mt-4 text-red-600 hover:text-red-700 font-medium"
          >
            Clear Cart
          </button>
        </div>

        {/* Order Summary */}
        <div>
          <div className="card p-6 sticky top-24">
            <h2 className="font-serif text-2xl font-bold mb-6">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">${total().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold">
                  {total() >= 100 ? 'FREE' : '$15.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (estimated)</span>
                <span className="font-semibold">${(total() * 0.08).toFixed(2)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-primary">
                    ${(total() + (total() >= 100 ? 0 : 15) + total() * 0.08).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {total() < 100 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
                Add ${(100 - total()).toFixed(2)} more for free shipping!
              </div>
            )}

            <Link to="/checkout" className="btn btn-primary w-full mb-3">
              Proceed to Checkout
            </Link>

            <Link
              to="/products"
              className="btn btn-outline w-full text-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
