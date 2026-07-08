import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWriterLeaderboard, type LeaderboardEntry } from '../lib/rankings';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import ProfileAvatar from '../components/ProfileAvatar';
import { usePageMeta } from '../hooks/usePageMeta';
import { WRITERS_META } from '../lib/seoMeta';
import { buildCollectionJsonLd, buildWebSiteJsonLd } from '../lib/seo';
import { getWriterPath } from '../lib/slug';

export default function Writers() {
  const [writers, setWriters] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  usePageMeta({
    title: WRITERS_META.title,
    description: WRITERS_META.description,
    keywords: WRITERS_META.keywords,
    path: WRITERS_META.path,
    jsonLd: [
      buildWebSiteJsonLd(window.location.origin),
      buildCollectionJsonLd(WRITERS_META.title, WRITERS_META.description, WRITERS_META.path),
    ],
  });

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchWriterLeaderboard(30)
      .then((data) => {
        setWriters(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load the writer leaderboard. Please try again.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="page writers-page">
      <PageHeader
        title="Top Telugu Story Writers"
        subtitle="Writers and authors ranked by reader appreciations — follow your favourite kamakathalu voices"
      />

      {loading ? (
        <div className="page-loading page-loading-inline" aria-busy="true">
          <div className="spinner" />
        </div>
      ) : error ? (
        <EmptyState
          message={error}
          action={<button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}>Retry</button>}
        />
      ) : writers.length === 0 ? (
        <EmptyState message="No writers on the leaderboard yet. Be the first to publish and earn likes!" />
      ) : (
        <ol className="leaderboard-list">
          {writers.map((w, i) => {
            const displayName = w.display_name ?? w.slug;
            return (
              <li key={w.id} className="leaderboard-item">
                <span className="leaderboard-rank">#{i + 1}</span>
                <ProfileAvatar
                  name={displayName}
                  avatarUrl={w.avatar_url}
                  size="sm"
                  className="leaderboard-avatar-img"
                />
                <div className="leaderboard-body">
                  <Link to={getWriterPath(w.slug)} className="leaderboard-name">
                    {displayName}
                  </Link>
                  <span className="leaderboard-handle">@{w.slug}</span>
                </div>
                <div className="leaderboard-stats">
                  <span>{Number(w.total_likes).toLocaleString()} likes</span>
                  <span>{w.story_count} stories</span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}