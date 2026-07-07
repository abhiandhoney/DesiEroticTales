import { Link } from 'react-router-dom';
import { STORY_CATEGORIES } from '../types';
import { getCategoryPath } from '../lib/slug';

interface CategoryNavProps {
  title?: string;
  /** Highlight the active category slug path */
  activeCategory?: string;
}

/** Internal linking block for SEO — category archive links. */
export default function CategoryNav({ title = 'Browse by category', activeCategory }: CategoryNavProps) {
  return (
    <nav className="category-nav" aria-label="Story categories">
      <h2 className="category-nav-title">{title}</h2>
      <ul className="category-nav-list">
        {STORY_CATEGORIES.map((cat) => (
          <li key={cat}>
            <Link
              to={getCategoryPath(cat)}
              className={activeCategory === cat ? 'category-nav-link active' : 'category-nav-link'}
            >
              {cat}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}