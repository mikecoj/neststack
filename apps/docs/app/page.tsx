import Link from 'next/link';

const features = [
  {
    title: 'Type-Safe by Design',
    description:
      'Recursive dot-path types give you auto-completion and compile-time safety for every configuration key. No more string guessing.',
  },
  {
    title: 'Runtime Validation',
    description:
      'Zod schemas validate every value at startup. Invalid configuration fails fast with clear error messages — never at 3 AM in production.',
  },
  {
    title: 'Secret Management',
    description:
      'Declare sensitive keys once. They are automatically masked in logs, diagnostics, and admin endpoints. No accidental credential leaks.',
  },
  {
    title: 'O(1) Performance',
    description:
      'Pre-built flat lookup maps deliver instant access. Configuration is read thousands of times — every read is a single Map.get() call.',
  },
  {
    title: 'Immutable State',
    description:
      'All configuration is deep-frozen after validation. Accidental mutation throws a TypeError instead of silently corrupting application state.',
  },
  {
    title: 'Standard NestJS Patterns',
    description:
      'forRoot(), forRootAsync(), and forFeature() — the same dynamic module patterns you already know. No new paradigms to learn.',
  },
];

const trustPoints = [
  '100% test coverage on every package',
  'Strict TypeScript with no escape hatches',
  'Independent semantic versioning',
  'NPM provenance attestation',
  'CodeQL security scanning',
  'MIT licensed, open source',
];

export default function HomePage() {
  return (
    <div className="landing">
      <section className="hero">
        <p className="hero-badge">Enterprise-Grade NestJS Modules</p>
        <h1 className="hero-title">
          Build production systems
          <br />
          with <span className="accent">confidence</span>
        </h1>
        <p className="hero-subtitle">
          NestStack is a collection of rigorously tested, type-safe NestJS packages built for
          banking, fintech, and mission-critical applications. Every module follows the same
          standard: strict types, full coverage, and security-first design.
        </p>
        <div className="hero-actions">
          <Link href="/docs/config" className="btn btn-primary">
            Get Started
          </Link>
          <Link href="/docs" className="btn btn-secondary">
            Browse Packages
          </Link>
        </div>
        <div className="hero-install">
          <code>npm install @neststack/config zod</code>
        </div>
      </section>

      <section className="features">
        <h2 className="section-title">Why NestStack?</h2>
        <p className="section-subtitle">
          Each package solves a critical infrastructure concern so you can focus on your business
          logic.
        </p>
        <div className="features-grid">
          {features.map((feature) => (
            <div key={feature.title} className="feature-card">
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="packages-section">
        <h2 className="section-title">Packages</h2>
        <div className="package-card">
          <div className="package-header">
            <h3 className="package-name">@neststack/config</h3>
            <span className="package-badge">Stable</span>
          </div>
          <p className="package-description">
            Type-safe configuration management with Zod validation, secret masking, O(1) lookups,
            and deep immutability. The standard way to handle configuration in enterprise NestJS
            applications.
          </p>
          <Link href="/docs/config" className="package-link">
            View documentation &rarr;
          </Link>
        </div>
        <p className="packages-coming">
          More packages are in development. Each will follow the same enterprise standards.
        </p>
      </section>

      <section className="trust">
        <h2 className="section-title">Built for Production</h2>
        <div className="trust-grid">
          {trustPoints.map((point) => (
            <div key={point} className="trust-item">
              <span className="trust-check">&#10003;</span>
              <span>{point}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="cta">
        <h2 className="cta-title">Ready to get started?</h2>
        <p className="cta-description">
          Install your first NestStack package and have type-safe, validated configuration running
          in minutes.
        </p>
        <Link href="/docs/config" className="btn btn-primary">
          Read the Docs
        </Link>
      </section>
    </div>
  );
}
