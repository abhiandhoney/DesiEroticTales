import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AgeGate from './components/AgeGate';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Stories from './pages/Stories';
import StoryDetail from './pages/StoryDetail';
import Submit from './pages/Submit';
import EditStory from './pages/EditStory';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

const routerBasename =
  import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '');

export default function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <AgeGate />
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
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
      {/* ADSTERRA: Global pop-under / sticky ad script can go here */}
    </BrowserRouter>
  );
}