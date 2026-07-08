import { STORY_CATEGORY_DEFS } from '../lib/categories';

interface StoryFiltersProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  searchPlaceholder?: string;
  sort?: 'newest' | 'popular' | 'top_rated' | 'trending';
  onSortChange?: (value: 'newest' | 'popular' | 'top_rated' | 'trending') => void;
  compact?: boolean;
}

export default function StoryFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  searchPlaceholder = 'Search stories...',
  sort,
  onSortChange,
  compact = false,
}: StoryFiltersProps) {
  const hasSearch = search !== undefined && onSearchChange;

  return (
    <div className={`filters-section${compact ? ' filters-section--compact' : ''}`}>
      <div className="filters-bar">
        {hasSearch && (
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input filters-search"
            aria-label="Search stories"
          />
        )}
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="select filter-select"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {STORY_CATEGORY_DEFS.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
        {sort !== undefined && onSortChange && (
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as 'newest' | 'popular' | 'top_rated' | 'trending')}
            className="select filter-select"
            aria-label="Sort stories"
          >
            <option value="newest">Newest first</option>
            <option value="popular">Most read</option>
            <option value="top_rated">Top rated</option>
            <option value="trending">Trending (30d)</option>
          </select>
        )}
      </div>
    </div>
  );
}