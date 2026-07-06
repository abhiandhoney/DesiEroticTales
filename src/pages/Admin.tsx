import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Story, StoryStatus } from '../types';

export default function Admin() {
  const [pending, setPending] = useState<Story[]>([]);
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    fetchStories();
  }, [tab]);

  async function fetchStories() {
    setLoading(true);
    let query = supabase.from('stories').select('*').order('created_at', { ascending: false });

    if (tab === 'pending') {
      query = query.eq('status', 'pending');
    }

    const { data, error } = await query;
    if (!error && data) {
      if (tab === 'pending') setPending(data);
      else setAllStories(data);
    }
    setLoading(false);
  }

  async function updateStatus(id: string, status: StoryStatus) {
    setActionId(id);
    const { error } = await supabase
      .from('stories')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setPending((prev) => prev.filter((s) => s.id !== id));
      setAllStories((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      );
    }
    setActionId(null);
  }

  const stories = tab === 'pending' ? pending : allStories;

  return (
    <div className="page admin-page">
      <header className="page-header">
        <h1>Moderation Panel</h1>
        <p className="page-subtitle">Approve or reject submitted stories</p>
      </header>

      <div className="admin-tabs">
        <button
          className={`tab-btn ${tab === 'pending' ? 'active' : ''}`}
          onClick={() => setTab('pending')}
        >
          Pending ({pending.length})
        </button>
        <button
          className={`tab-btn ${tab === 'all' ? 'active' : ''}`}
          onClick={() => setTab('all')}
        >
          All Stories
        </button>
      </div>

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : stories.length === 0 ? (
        <p className="empty-state">No {tab === 'pending' ? 'pending' : ''} stories.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stories.map((story) => (
                <tr key={story.id}>
                  <td>
                    <strong>{story.title}</strong>
                    <p className="admin-preview">
                      {story.content.slice(0, 100)}…
                    </p>
                  </td>
                  <td>{story.category}</td>
                  <td>
                    <span className={`status-badge status-${story.status}`}>
                      {story.status}
                    </span>
                  </td>
                  <td>
                    {new Date(story.created_at).toLocaleDateString()}
                  </td>
                  <td className="admin-actions">
                    {story.status === 'pending' && (
                      <>
                        <button
                          className="btn btn-sm btn-success"
                          disabled={actionId === story.id}
                          onClick={() => updateStatus(story.id, 'approved')}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          disabled={actionId === story.id}
                          onClick={() => updateStatus(story.id, 'rejected')}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {story.status === 'approved' && (
                      <button
                        className="btn btn-sm btn-danger"
                        disabled={actionId === story.id}
                        onClick={() => updateStatus(story.id, 'rejected')}
                      >
                        Unpublish
                      </button>
                    )}
                    {story.status === 'rejected' && (
                      <button
                        className="btn btn-sm btn-success"
                        disabled={actionId === story.id}
                        onClick={() => updateStatus(story.id, 'approved')}
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}