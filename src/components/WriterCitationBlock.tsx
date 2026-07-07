import { Link } from 'react-router-dom';
import { getWriterPath } from '../lib/slug';
import { getStoryCanonicalPath } from '../lib/slug';
import type { Story } from '../types';

interface WriterCitationBlockProps {
  story: Story;
  author: { username: string; display_name?: string | null; bio?: string | null };
}

export default function WriterCitationBlock({ story, author }: WriterCitationBlockProps) {
  const citeUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${getStoryCanonicalPath(story)}`
    : getStoryCanonicalPath(story);
  const citeText = `"${story.title}" — a slow-burn ${story.category} story on DesiEroticTales (${citeUrl})`;

  return (
    <section className="writer-citation-block" aria-label="About the writer">
      <h2 className="writer-citation-heading">About the Writer</h2>
      <p className="writer-citation-byline">
        Written by{' '}
        <Link to={getWriterPath(author.username)} className="story-author-link">
          @{author.username}
        </Link>
        {author.display_name && author.display_name !== author.username && (
          <span className="story-author-display"> ({author.display_name})</span>
        )}
      </p>
      {author.bio && <p className="writer-citation-bio">{author.bio}</p>}
      <div className="writer-citation-format">
        <h3 className="writer-citation-subheading">How to cite this story</h3>
        <p className="writer-citation-text">
          <cite>{citeText}</cite>
        </p>
      </div>
    </section>
  );
}