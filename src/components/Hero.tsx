import './Hero.css';

/**
 * Hero component - Minimal header with title only
 */
export function Hero() {
  return (
    <section className="hero">
      <div className="hero-container">
        <h1 className="hero-title">
          <span className="hero-title-main">English Pro</span>
          <span className="hero-title-accent">Spanish Phrase Analyzer</span>
        </h1>
      </div>
    </section>
  );
}
