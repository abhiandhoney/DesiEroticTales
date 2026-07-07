import { Link } from 'react-router-dom';
import { getSiteHostname } from '../lib/site';
import AdSlot from './AdSlot';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner footer-columns">
        <div className="footer-col footer-col-brand">
          <p className="footer-brand">DesiEroticTales</p>
          <p className="footer-tagline">
            Telugu &amp; Desi stories that linger in your mind
            {' '}| <span className="telugu-text" lang="te" title="Stories (Kathalu)">కథలు</span>
          </p>
          <p className="footer-disclaimer">Adults 18+ only · Age verification required</p>
        </div>

        <div className="footer-col">
          <p className="footer-col-title">Explore</p>
          <nav className="footer-nav" aria-label="Explore">
            <Link to="/">Home</Link>
            <Link to="/stories">Stories</Link>
            <Link to="/writers">Top Writers</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
          </nav>
        </div>

        <div className="footer-col">
          <p className="footer-col-title">Legal</p>
          <nav className="footer-nav" aria-label="Legal">
            <Link to="/privacy-policy">Privacy</Link>
            <Link to="/cookie-policy">Cookies</Link>
            <Link to="/report-content">Report content</Link>
          </nav>
        </div>

        <div className="footer-col">
          <p className="footer-col-title">Writers</p>
          <nav className="footer-nav" aria-label="Writers">
            <Link to="/submit">Submit a story</Link>
            <Link to="/profile">My profile</Link>
            <Link to="/profile/edit">Edit profile</Link>
          </nav>
        </div>

        <div className="footer-col footer-col-meta">
          <p className="footer-copy">
            (c) {new Date().getFullYear()} {getSiteHostname()}
          </p>
          <p className="footer-note">Free to read · New tales added regularly</p>
        </div>
        <AdSlot slot="footer" />
      </div>
    </footer>
  );
}