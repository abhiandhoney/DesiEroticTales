import { useState, useEffect } from 'react';

const STORAGE_KEY = 'desierotictales_age_verified';

export default function AgeGate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem(STORAGE_KEY);
    if (!verified) setVisible(true);
  }, []);

  function confirm() {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  }

  function decline() {
    window.location.href = 'https://www.google.com';
  }

  if (!visible) return null;

  return (
    <div className="age-gate-overlay">
      <div className="age-gate-modal">
        <div className="age-gate-icon">🔞</div>
        <h2>వయస్సు నిర్ధారణ · Age Verification</h2>
        <p>
          DesiEroticTales contains mature content intended for adults only.
          <br />
          <span className="telugu-text">ఈ వెబ్‌సైట్‌లో పెద్దలకు మాత్రమే అనుకూలమైన కథలు ఉన్నాయి.</span>
        </p>
        <p className="age-gate-question">Are you 18 years or older?</p>
        <div className="age-gate-actions">
          <button className="btn btn-primary" onClick={confirm}>
            Yes, I am 18+
          </button>
          <button className="btn btn-ghost" onClick={decline}>
            No, leave
          </button>
        </div>
      </div>
    </div>
  );
}