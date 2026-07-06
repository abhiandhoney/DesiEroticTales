import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Story, StoryStatus } from '../types';
import { getStoryTeaser } from '../lib/storyTeaser';
import StoryReviewModal from '../components/StoryReviewModal';

export default function Admin() {
  const [pending, setPending] = useState<Story[]>([]);
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [reviewStory, setReviewStory] = useState<Story | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => { fetchStories(); }, [tab]);

  async function fetchStories() {
    setLoading(true);
    let query = supabase.from('stories').select('*').order('created_at', { ascending: false });
    if (tab === 'pending') query = query.eq('status', 'pending');
    const { data } = await query;
    if (data) {
      if (tab === 'pending') setPending(data);
      else setAllStories(data);
    }
    setLoading(false);
  }

  async function updateStatus(id: string, status: StoryStatus) {
    setActionId(id);
    setFeedback('');
    const { error } = await supabase.from('stories').update({ status }).eq('id', id);
    if (error) {
      setFeedback(`Failed to update: ${error.message}`);
    } else {
      setPending((prev) => prev.filter((s) => s.id !== id));
      setAllStories((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
      setReviewStory(null);
      setFeedback(`Story ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'updated'}.`);
      setTimeout(() => setFeedback(''), 4000);
    }
    setActionId(null);
  }

  const stories = tab === 'pending' ? pending : allStories;

  return (
    <div className="page admin-page">
      <header className="page-header">
        <h1>Moderation Panel</h1>
        <p className="page-subtitle">Review each story in full before approving or rejecting</p>
      </header>

      {feedback && (
        <div className={`admin-feedback ${feedback.startsWith('Failed') ? 'admin-feedback-error' : ''}`}>
          {feedback}
        </div>
      )}

      <div className="admin-tabs">
        <button className={`tab-btn ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>
          Pending ({pending.length})
        </button>
        <button className={`tab-btn ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
          All Stories
        </button>
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : stories.length === 0 ? (
        <p className="empty-state">No {tab === 'pending' ? 'pending ' : ''}stories.</p>
      ) : (
        <div className="admin-cards">
          {stories.map((story) => (
            <article key={story.id} className="admin-card">
              <div className="admin-card-header">
                <span className={`status-badge status-${story.status}`}>{story.status}</span>
                <span className="admin-card-date">
                  {new Date(story.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="admin-card-title">{story.title}</h3>
              <p className="admin-card-category">{story.category}</p>
              <p className="admin-preview">{getStoryTeaser(story, 160)}</p>
              <div className="admin-card-actions">
                <Link to={`/edit/${story.id}`} className="btn btn-ghost btn-sm">
                  Edit
                </Link>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setReviewStory(story)}
                >
                  Read &amp; moderate
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {reviewStory && (
        <StoryReviewModal
          story={reviewStory}
          onClose={() => setReviewStory(null)}
          onUpdateStatus={updateStatus}
          actionLoading={actionId === reviewStory.id}
        />
      )}
    </div>
  );
}