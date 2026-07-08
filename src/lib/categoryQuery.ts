import type { StoryCategory } from './categories';

type FilterableQuery = {
  or: (filters: string) => FilterableQuery;
};

/** Match stories whose primary or secondary categories include `category`. */
export function applyCategoryFilter<T extends FilterableQuery>(query: T, category: StoryCategory): T {
  return query.or(`category.eq.${category},categories.cs.{"${category}"}`) as T;
}