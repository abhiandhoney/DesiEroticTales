import { categoryDescription, phraseForCategory } from '../lib/seoKeywords';

interface CategoryIntroProps {
  category: string;
  storyCount: number;
}

export default function CategoryIntro({ category, storyCount }: CategoryIntroProps) {
  const phrase = phraseForCategory(category);
  const intro = categoryDescription(category);

  return (
    <div className="category-intro">
      <p className="category-intro-text">{intro}</p>
      <p className="category-intro-stats">
        {storyCount.toLocaleString()} free {phrase.toLowerCase()} available to read online.
      </p>
    </div>
  );
}