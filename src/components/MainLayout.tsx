import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import AgeGate from './AgeGate';

export default function MainLayout() {
  return (
    <>
      <AgeGate />
      <a href="#main-content" className="skip-link">Skip to content</a>
      <div className="app">
        <Navbar />
        <main id="main-content" className="main-content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  );
}