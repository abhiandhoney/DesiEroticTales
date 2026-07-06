import { useState } from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AgeGate from './components/AgeGate';
import ProtectedRoute from './components/ProtectedRoute';
import { isAuthCallbackRoute } from './lib/auth';
import Home from './pages/Home';
import Stories from './pages/Stories';
import StoryDetail from './pages/StoryDetail';
import Submit from './pages/Submit';
import EditStory from './pages/EditStory';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import AuthCallback, { AuthCallbackError } from './pages/AuthCallback';

const routerBasename =
  import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '');

function AppRoutes({ postAuthRedirect }: { postAuthRedirect: string | null }) {
  return (
    <>
      {postAuthRedirect && <Navigate to={postAuthRedirect} replace />}
      <AgeGate />
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/auth/callback" element={<Navigate to="/" replace />} />
            <Route path="/" element={<Home />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/story/:id" element={<StoryDetail />} />
            <Route path="/submit" element={<ProtectedRoute requireWriter><Submit /></ProtectedRoute>} />
            <Route path="/edit/:id" element={<ProtectedRoute requireWriter><EditStory /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </>
  );
}

export default function App() {
  const [bootState, setBootState] = useState<'callback' | 'ready' | 'error'>(() =>
    isAuthCallbackRoute() ? 'callback' : 'ready',
  );
  const [bootError, setBootError] = useState('');
  const [postAuthRedirect, setPostAuthRedirect] = useState<string | null>(null);

  if (bootState === 'callback') {
    return (
      <AuthCallback
        onDone={(returnPath) => {
          setPostAuthRedirect(returnPath);
          setBootState('ready');
        }}
        onError={(message) => {
          setBootError(message);
          setBootState('error');
        }}
      />
    );
  }

  if (bootState === 'error') {
    return (
      <BrowserRouter basename={routerBasename}>
        <AuthCallbackError message={bootError} />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter basename={routerBasename}>
      <AppRoutes postAuthRedirect={postAuthRedirect} />
    </BrowserRouter>
  );
}