import { STORY_CATEGORIES } from '../types';

interface StoryFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  searchPlaceholder?: string;
  sort?: 'newest' | 'popular';
  onSortChange?: (value: 'newest' | 'popular') => void;
}

export default function StoryFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  searchPlaceholder = 'Search stories...',
  sort,
  onSortChange,
}: StoryFiltersProps) {
  return (
    <div className="filters-section">
      <input
        type="search"
        placeholder={searchPlaceholder}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="input"
        aria-label="Search stories"
      />
      <div className="filter-row">
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="select filter-select"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {STORY_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {sort !== undefined && onSortChange && (
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as 'newest' | 'popular')}
            className="select filter-select"
            aria-label="Sort stories"
          >
            <option value="newest">Newest first</option>
            <option value="popular">Most read</option>
          </select>
        )}
      </div>
    </div>
  );
}