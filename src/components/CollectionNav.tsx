import { Link } from 'react-router-dom';
import { getStoryPath } from '../lib/slug';
import { getCollectionPath, type StoryCollectionLink } from '../lib/collections';

interface CollectionNavProps {
  link: StoryCollectionLink;
  currentStoryId: string;
  writerUsername?: string;
}

export default function CollectionNav({ link, currentStoryId, writerUsername }: CollectionNavProps) {
  const collectionPath = getCollectionPath(link.collection, writerUsername);
  const approvedParts = link.siblings.filter((p) => p.story.status === 'approved');

  return (
    <nav className="collection-nav" aria-label="Story collection">
      <p className="collection-nav-label">
        Part {link.part_number} of{' '}
        <Link to={collectionPath} className="collection-nav-series">{link.collection.title}</Link>
      </p>
      {approvedParts.length > 1 && (
        <ol className="collection-nav-parts">
          {approvedParts.map(({ story, part_number }) => (
            <li key={story.id} className={story.id === currentStoryId ? 'active' : ''}>
              {story.id === currentStoryId ? (
                <span>Part {part_number}: {story.title}</span>
              ) : (
                <Link to={getStoryPath(story)}>Part {part_number}: {story.title}</Link>
              )}
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}