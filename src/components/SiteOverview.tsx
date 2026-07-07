import { Link } from 'react-router-dom';
import { POPULAR_CATEGORIES } from '../lib/seoKeywords';
import { getCategoryPath } from '../lib/slug';

export default function SiteOverview() {
  return (
    <section className="site-overview site-overview--about" aria-label="About DesiEroticTales">
      <h2 className="site-overview-title">What is DesiEroticTales?</h2>
      <p className="site-overview-lead">
        DesiEroticTales is a free platform for high-quality, slow-burn Telugu and Desi erotic stories
        with AI-generated images. We publish realistic, emotional kathalu — akka chelli tales, aunty stories,
        office romance, college fiction, and more. Adults 18+ only.
      </p>
      <h3 className="site-overview-subtitle">Popular categories</h3>
      <ul className="site-overview-categories">
        {POPULAR_CATEGORIES.map(({ category, description }) => (
          <li key={category}>
            <Link to={getCategoryPath(category)} className="site-overview-cat-link">
              {category}
            </Link>
            <span className="site-overview-cat-desc"> — {description}</span>
          </li>
        ))}
      </ul>
      <p className="site-overview-cta">
        <Link to="/stories">Browse all stories &rarr;</Link>
      </p>
    </section>
  );
}