import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AgeGate from './components/AgeGate';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Stories from './pages/Stories';
import StoryDetail from './pages/StoryDetail';
import Submit from './pages/Submit';
import Admin from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <AgeGate />
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/story/:id" element={<StoryDetail />} />
            <Route path="/submit" element={<ProtectedRoute requireWriter><Submit /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
          </Routes>
        </main>
        <Footer />
      </div>
      {/* ADSTERRA: Global pop-under / sticky ad script can go here */}
    </BrowserRouter>
  );
}