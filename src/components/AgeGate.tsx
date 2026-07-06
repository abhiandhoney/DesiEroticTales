import { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'desierotictales_age_verified';

export default function AgeGate() {
  const [visible, setVisible] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    confirmRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  if (!visible) return null;

  function confirm() {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  }

  return (
    <div className="age-gate-overlay" role="presentation">
      <div
        className="age-gate-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
      >
        <div className="age-gate-icon" aria-hidden="true">18+</div>
        <h2 id="age-gate-title">
          <span className="telugu-text" lang="te" title="Age verification">వయస్సు నిర్ధారణ</span>
          {' '}| Age Verification
        </h2>
        <p>
          DesiEroticTales contains mature content intended for adults only.
          <br />
          <span className="telugu-text" lang="te" title="This site contains adult-only stories">
            ఈ వెబ్‌సైట్‌లో పెద్దలకు మాత్రమే అనుకూలమైన కథలు ఉన్నాయి.
          </span>
        </p>
        <p className="age-gate-question">Are you 18 years or older?</p>
        <div className="age-gate-actions">
          <button
            ref={confirmRef}
            type="button"
            className="btn btn-primary"
            onClick={confirm}
          >
            Yes, I am 18+
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => { window.location.href = 'https://www.google.com'; }}
          >
            No, leave
          </button>
        </div>
      </div>
    </div>
  );
}