import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Story } from '../types';
import ReadingProgress from '../components/ReadingProgress';
import StoryCard from '../components/StoryCard';

export default function StoryDetail() {
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [related, setRelated] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) { fetchStory(id); incrementViews(id); }
  }, [id]);

  async function fetchStory(storyId: string) {
    setLoading(true);
    const { data, error: err } = await supabase.from('stories').select('*').eq('id', storyId).eq('status', 'approved').single();
    if (err || !data) { setError('Story not found or not yet approved.'); setLoading(false); return; }
    setStory(data);
    fetchRelated(data.category, data.id);
    setLoading(false);
  }

  async function incrementViews(storyId: string) {
    await supabase.rpc('increment_story_views', { story_id: storyId });
  }

  async function fetchRelated(category: string, currentId: string) {
    const { data } = await supabase.from('stories').select('*').eq('status', 'approved')
      .eq('category', category).neq('id', currentId).order('views', { ascending: false }).limit(3);
    if (data) setRelated(data);
  }

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (error || !story) return (
    <div className="page error-page">
      <h2>{error || 'Story not found'}</h2>
      <Link to="/stories" className="btn btn-primary">Back to stories</Link>
    </div>
  );

  return (
    <article className="page story-detail-page">
      <ReadingProgress />
      <Link to="/stories" className="story-back-link">&larr; Back to all stories</Link>
      <header className="story-header">
        <span className="story-category">{story.category}</span>
        <h1 className="story-detail-title">{story.title}</h1>
        <div className="story-detail-meta">
          <span>{story.views.toLocaleString()} reads</span>
          <span> | </span>
          <span>{new Date(story.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </header>
      {story.image_url && <div className="story-hero-image"><img src={story.image_url} alt={story.title} /></div>}
      <div className="ad-slot ad-slot-story-top" data-adsterra="story-top">{/* ADSTERRA */}</div>
      <div className="story-content">
        {story.content.split(/\n\n+/).filter(Boolean).map((para, i) => (
          <p key={i} className="story-paragraph">{para}</p>
        ))}
      </div>
      <div className="ad-slot ad-slot-story-bottom" data-adsterra="story-bottom">{/* ADSTERRA */}</div>
      {related.length > 0 && (
        <section className="related-stories">
          <h2 className="section-title">You may also like</h2>
          <div className="stories-grid stories-grid-compact">{related.map((s) => <StoryCard key={s.id} story={s} />)}</div>
        </section>
      )}
    </article>
  );
}