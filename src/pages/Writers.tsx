import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWriterLeaderboard, type LeaderboardEntry } from '../lib/rankings';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import ProfileAvatar from '../components/ProfileAvatar';

export default function Writers() {
  const [writers, setWriters] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWriterLeaderboard(30).then((data) => {
      setWriters(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="page writers-page">
      <PageHeader
        title="Top Writers"
        subtitle="Ranked by total likes on published stories"
      />

      {loading ? (
        <div className="page-loading page-loading-inline" aria-busy="true">
          <div className="spinner" />
        </div>
      ) : writers.length === 0 ? (
        <EmptyState message="No writers on the leaderboard yet. Be the first to publish and earn likes!" />
      ) : (
        <ol className="leaderboard-list">
          {writers.map((w, i) => (
            <li key={w.user_id} className="leaderboard-item">
              <span className="leaderboard-rank">#{i + 1}</span>
              <ProfileAvatar
                name={w.display_name ?? w.username ?? '?'}
                avatarUrl={w.avatar_url}
                size="sm"
                className="leaderboard-avatar-img"
              />
              <div className="leaderboard-body">
                <Link to={`/writer/${w.username}`} className="leaderboard-name">
                  {w.display_name ?? w.username}
                </Link>
                <span className="leaderboard-handle">@{w.username}</span>
              </div>
              <div className="leaderboard-stats">
                <span>{Number(w.total_likes).toLocaleString()} likes</span>
                <span>{w.story_count} stories</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}