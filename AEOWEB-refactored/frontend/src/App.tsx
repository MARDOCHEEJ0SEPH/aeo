import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';
import { useWebSocket } from './hooks/useWebSocket';
import { useAuth } from './hooks/useAuth';

// Lazy load routes for code splitting
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AEOOptimizer = lazy(() => import('./pages/AEOOptimizer'));
const Analytics = lazy(() => import('./pages/Analytics'));
const ContentEditor = lazy(() => import('./pages/ContentEditor'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  const { user, loading: authLoading } = useAuth();
  const { connected, metrics } = useWebSocket();

  if (authLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <>
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/aeo-optimizer" element={<AEOOptimizer />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/content/:id" element={<ContentEditor />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Suspense>
      </Layout>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />

      {/* WebSocket connection indicator */}
      {!connected && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg">
          Disconnected - Reconnecting...
        </div>
      )}
    </>
  );
}

export default App;
