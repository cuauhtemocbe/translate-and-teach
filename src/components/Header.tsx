import './Header.css';

/**
 * Header component for English Pro app
 * Displays app title and tagline
 */
export function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <h1 className="header-title">
          <span className="header-icon">🌐</span> English Pro
        </h1>
        <p className="header-tagline">Spanish Phrase Analyzer</p>
      </div>
    </header>
  );
}
