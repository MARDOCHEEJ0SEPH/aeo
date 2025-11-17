import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import HairQuiz from './pages/HairQuiz';
import Subscribe from './pages/Subscribe';
import AEODashboard from './pages/AEODashboard';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/hair-quiz" element={<HairQuiz />} />
          <Route path="/subscribe" element={<Subscribe />} />
          <Route path="/aeo-dashboard" element={<AEODashboard />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
