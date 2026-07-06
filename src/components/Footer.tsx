export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <p className="footer-brand">DesiEroticTales</p>
        <p className="footer-tagline">
          Telugu &amp; Desi stories that linger in your mind
          {' '}| <span className="telugu-text" lang="te" title="Stories (Kathalu)">కథలు</span>
        </p>
        <p className="footer-copy">
          (c) {new Date().getFullYear()} desierotictales.qd.je | Adults 18+ only
        </p>
        {/* ADSTERRA: Place ad script block here */}
      </div>
    </footer>
  );
}