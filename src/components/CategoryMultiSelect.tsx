import { STORY_CATEGORY_DEFS, type StoryCategory } from '../lib/categories';

interface CategoryMultiSelectProps {
  value: StoryCategory[];
  onChange: (next: StoryCategory[]) => void;
  disabled?: boolean;
}

export default function CategoryMultiSelect({
  value,
  onChange,
  disabled = false,
}: CategoryMultiSelectProps) {
  function toggle(cat: StoryCategory) {
    if (disabled) return;
    if (value.includes(cat)) {
      if (value.length === 1) return;
      onChange(value.filter((c) => c !== cat));
      return;
    }
    onChange([...value, cat]);
  }

  return (
    <div className="category-multi-select" role="group" aria-label="Story categories">
      <p className="form-hint">Select one or more categories. The first selected is the primary category for URLs.</p>
      <div className="category-chip-grid">
        {STORY_CATEGORY_DEFS.map((def) => {
          const active = value.includes(def.id);
          const primary = value[0] === def.id;
          return (
            <button
              key={def.id}
              type="button"
              className={`category-chip ${active ? 'category-chip--active' : ''} ${primary ? 'category-chip--primary' : ''}`}
              disabled={disabled}
              aria-pressed={active}
              onClick={() => toggle(def.id)}
            >
              {def.label}
              {primary && <span className="category-chip-badge">Primary</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}