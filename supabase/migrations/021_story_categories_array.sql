-- Canonical categories + multi-category support.

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT NULL;

-- Backfill from legacy single category (run before app deploy maps old names in SQL).
UPDATE public.stories
SET category = CASE category
  WHEN 'Pinni-Pedhamma' THEN 'Pinni-Peddamma'
  WHEN 'Panimanishi' THEN 'Office'
  WHEN 'Amma-Koduku' THEN 'Village'
  WHEN 'Neighbor' THEN 'Village'
  WHEN 'Pakkinti Valu' THEN 'Village'
  WHEN 'Cousin' THEN 'Village'
  WHEN 'Maradhalu' THEN 'Village'
  WHEN 'MILF' THEN 'Aunty'
  WHEN 'Vadhina' THEN 'Bhabhi'
  WHEN 'Friend' THEN 'First-Time'
  WHEN 'Yavannam' THEN 'First-Time'
  WHEN 'Fantasy' THEN 'Stranger'
  WHEN 'Gumpu' THEN 'Stranger'
  WHEN 'Audio' THEN 'Other'
  WHEN 'Photos' THEN 'Other'
  ELSE category
END
WHERE category IS NOT NULL;

UPDATE public.stories
SET categories = ARRAY[category]::TEXT[]
WHERE categories IS NULL OR cardinality(categories) = 0;

CREATE INDEX IF NOT EXISTS idx_stories_categories_gin
  ON public.stories USING GIN (categories);

CREATE INDEX IF NOT EXISTS idx_stories_approved_categories
  ON public.stories USING GIN (categories)
  WHERE status = 'approved';