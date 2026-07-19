import './Features.css';

interface Feature {
  icon: string;
  title: string;
  description: string;
  color: string;
}

const features: Feature[] = [
  {
    icon: '🌐',
    title: 'Smart Translation',
    description:
      'Context-aware English translations with cultural nuances and idiomatic expressions.',
    color: '#1E88E5',
  },
  {
    icon: '📖',
    title: 'Grammar Insights',
    description: 'Detailed breakdown of sentence structure, verb tenses, and grammatical patterns.',
    color: '#7C3AED',
  },
  {
    icon: '💡',
    title: 'Learning Tips',
    description: 'Practical advice on usage, common mistakes, and native speaker preferences.',
    color: '#42A5F5',
  },
  {
    icon: '🔄',
    title: 'Real Variations',
    description: 'Alternative phrasings used in everyday conversation across Spanish regions.',
    color: '#059669',
  },
];

/**
 * Features component - Card-based feature showcase
 */
export function Features() {
  return (
    <section className="features">
      <div className="features-container">
        <div className="features-header">
          <h2 className="features-title">Everything You Need</h2>
          <p className="features-subtitle">
            Four comprehensive cards per query to accelerate your Spanish mastery.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="feature-card"
              style={
                {
                  animationDelay: `${index * 0.1}s`,
                  '--accent-color': feature.color,
                } as React.CSSProperties
              }
            >
              <div className="feature-icon-wrapper">
                <span className="feature-icon">{feature.icon}</span>
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
