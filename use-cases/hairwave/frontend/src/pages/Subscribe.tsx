import { Check, Package } from 'lucide-react';

export default function Subscribe() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-serif text-5xl font-bold text-center mb-4">Subscribe & Save 15%</h1>
        <p className="text-center text-xl text-gray-600 mb-12">
          Never run out of your favorite products. Cancel or modify anytime.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="text-white" size={32} />
            </div>
            <h3 className="font-serif text-xl font-bold mb-2">Monthly Delivery</h3>
            <p className="text-gray-600">Get your products delivered automatically every month</p>
          </div>

          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">15%</span>
            </div>
            <h3 className="font-serif text-xl font-bold mb-2">Save on Every Order</h3>
            <p className="text-gray-600">Enjoy 15% off on all subscription products</p>
          </div>

          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="text-white" size={32} />
            </div>
            <h3 className="font-serif text-xl font-bold mb-2">Full Flexibility</h3>
            <p className="text-gray-600">Skip, pause, or cancel anytime with no fees</p>
          </div>
        </div>

        <div className="card p-8 mb-8">
          <h2 className="font-serif text-3xl font-bold mb-6">How It Works</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Choose Your Products</h3>
                <p className="text-gray-600">Select the products you want to receive regularly</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Set Your Frequency</h3>
                <p className="text-gray-600">Choose monthly, bi-monthly, or quarterly delivery</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Save Automatically</h3>
                <p className="text-gray-600">Enjoy 15% off and free shipping on every order</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-primary text-white rounded-lg p-8 text-center">
          <h2 className="font-serif text-3xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-xl mb-6">Join 50,000+ happy subscribers and save today</p>
          <button className="btn bg-white text-primary hover:bg-white/90 text-lg">
            Browse Products
          </button>
        </div>
      </div>
    </div>
  );
}
