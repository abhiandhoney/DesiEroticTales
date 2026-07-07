import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import AgeGate from './AgeGate';
import { ToastProvider } from '../hooks/useToast';

export default function MainLayout() {
  return (
    <ToastProvider>
      <AgeGate />
      <a href="#main-content" className="skip-link">Skip to content</a>
      <div className="app">
        <Navbar />
        <main id="main-content" className="main-content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </ToastProvider>
  );
}