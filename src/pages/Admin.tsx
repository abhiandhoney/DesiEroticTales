import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Story, StoryStatus } from '../types';
import { getStoryTeaser } from '../lib/storyTeaser';
import StoryReviewModal from '../components/StoryReviewModal';
import { usePageMeta } from '../hooks/usePageMeta';
import { ADMIN_META } from '../lib/seoMeta';

export default function Admin() {
  const [pending, setPending] = useState<Story[]>([]);
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [reviewStory, setReviewStory] = useState<Story | null>(null);
  const [feedback, setFeedback] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StoryStatus>('all');

  usePageMeta({
    title: ADMIN_META.title,
    description: ADMIN_META.description,
    path: ADMIN_META.path,
    noIndex: ADMIN_META.noIndex,
  });

  useEffect(() => {
    fetchStories();
  }, [tab]);

  async function fetchPendingCount() {
    const { count, error: countError } = await supabase
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    if (!countError && count !== null) setPendingCount(count);
  }

  async function fetchStories() {
    setLoading(true);
    setError('');
    fetchPendingCount();

    let query = supabase.from('stories').select('*').order('created_at', { ascending: false });
    if (tab === 'pending') query = query.eq('status', 'pending');
    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(`Failed to load stories: ${fetchError.message}`);
      setLoading(false);
      return;
    }

    if (tab === 'pending') {
      setPending(data ?? []);
    } else {
      setAllStories(data ?? []);
    }
    setLoading(false);
  }

  async function toggleEditorsChoice(story: Story) {
    setActionId(story.id);
    const next = !story.is_editors_choice;
    const { error: updateError } = await supabase.from('stories').update({
      is_editors_choice: next,
      editors_choice_at: next ? new Date().toISOString() : null,
    }).eq('id', story.id);

    if (updateError) {
      setFeedback(`Failed: ${updateError.message}`);
    } else {
      const patch = { is_editors_choice: next, editors_choice_at: next ? new Date().toISOString() : null };
      setAllStories((prev) => prev.map((s) => (s.id === story.id ? { ...s, ...patch } : s)));
      setFeedback(next ? "Added to Editor's Choice." : "Removed from Editor's Choice.");
      setTimeout(() => setFeedback(''), 4000);
    }
    setActionId(null);
  }

  async function updateStatus(id: string, status: StoryStatus) {
    setActionId(id);
    setFeedback('');
    const { error: updateError } = await supabase.from('stories').update({ status }).eq('id', id);
    if (updateError) {
      setFeedback(`Failed to update: ${updateError.message}`);
    } else {
      setPending((prev) => prev.filter((s) => s.id !== id));
      setAllStories((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
      setPendingCount((prev) => (status !== 'pending' ? Math.max(0, prev - 1) : prev));
      setReviewStory(null);
      setFeedback(`Story ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'updated'}.`);
      setTimeout(() => setFeedback(''), 4000);
    }
    setActionId(null);
  }

  const rawStories = tab === 'pending' ? pending : allStories;

  const stories = useMemo(() => {
    const q = adminSearch.trim().toLowerCase();
    return rawStories.filter((s) => {
      if (tab === 'all' && statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q)
        || (s.teaser?.toLowerCase().includes(q) ?? false)
        || s.category.toLowerCase().includes(q)
      );
    });
  }, [rawStories, adminSearch, statusFilter, tab]);

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

      {error && <div className="form-error">{error}</div>}

      <div className="admin-toolbar">
        <input
          type="search"
          className="input admin-search"
          placeholder="Search title, teaser, category..."
          value={adminSearch}
          onChange={(e) => setAdminSearch(e.target.value)}
        />
        {tab === 'all' && (
          <select
            className="select admin-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | StoryStatus)}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        )}
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Story moderation tabs">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'pending'}
          className={`tab-btn ${tab === 'pending' ? 'active' : ''}`}
          onClick={() => setTab('pending')}
        >
          Pending ({pendingCount})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'all'}
          className={`tab-btn ${tab === 'all' ? 'active' : ''}`}
          onClick={() => setTab('all')}
        >
          All Stories
        </button>
      </div>

      {loading ? (
        <div className="page-loading" aria-busy="true"><div className="spinner" /></div>
      ) : stories.length === 0 ? (
        <p className="empty-state">No {tab === 'pending' ? 'pending ' : ''}stories.</p>
      ) : (
        <div className="admin-cards">
          {stories.map((story) => (
            <article key={story.id} className="admin-card">
              <div className="admin-card-header">
                <span className={`status-badge status-${story.status}`}>{story.status}</span>
                <span className="admin-card-date">
                  {story.updated_at && story.updated_at !== story.created_at
                    ? `Updated ${new Date(story.updated_at).toLocaleDateString()}`
                    : new Date(story.created_at).toLocaleDateString()}
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
                {story.status === 'approved' && tab === 'all' && (
                  <button
                    type="button"
                    className={`btn btn-sm ${story.is_editors_choice ? 'btn-success' : 'btn-ghost'}`}
                    disabled={actionId === story.id}
                    onClick={() => toggleEditorsChoice(story)}
                  >
                    {story.is_editors_choice ? "Editor's ✓" : "Editor's Choice"}
                  </button>
                )}
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