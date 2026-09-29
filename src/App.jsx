import { useState } from 'react';
import DonorPortal from './ui/DonorPortal.jsx';
import LogisticsConsole from './ui/LogisticsConsole.jsx';
import { resetDemoData } from './data/db.js';

export default function App() {
  const [view, setView] = useState('donor');

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="30" height="30">
              <ellipse cx="16" cy="12" rx="11" ry="4" fill="#E9A820" />
              <path d="M5 12c0 9 4 15 11 15s11-6 11-15" fill="#8FA39D" />
              <path d="M9 12c0 6 2 11 7 11" stroke="#fff" strokeOpacity=".5" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <h1>Food pickup and logistics</h1>
            <p>Move surplus food from function halls to the people who need it</p>
          </div>
        </div>
        <nav className="switch" aria-label="Choose a screen">
          <button className={view === 'donor' ? 'on' : ''} onClick={() => setView('donor')}>Donor</button>
          <button className={view === 'logistics' ? 'on' : ''} onClick={() => setView('logistics')}>Logistics admin</button>
        </nav>
      </header>

      <main>{view === 'donor' ? <DonorPortal /> : <LogisticsConsole />}</main>

      <footer className="foot">
        <span>Prototype. Data is saved in this browser only.</span>
        <button
          className="link"
          onClick={() => {
            if (window.confirm('Reset all demo data? This clears every request and assignment.')) resetDemoData();
          }}
        >
          Reset demo data
        </button>
      </footer>
    </div>
  );
}
