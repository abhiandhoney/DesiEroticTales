import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { STORY_CATEGORIES, TEASER_MAX_LENGTH, type StoryCategory } from '../types';

export default function Submit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [teaser, setTeaser] = useState('');
  const [category, setCategory] = useState<StoryCategory>(STORY_CATEGORIES[0]);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (title.trim().length < 5) { setError('Title must be at least 5 characters.'); return; }
    if (teaser.trim().length > TEASER_MAX_LENGTH) {
      setError(`Teaser must be ${TEASER_MAX_LENGTH} characters or fewer.`);
      return;
    }
    if (content.trim().length < 200) { setError('Story must be at least 200 characters.'); return; }

    setSubmitting(true);
    setError('');
    let imageUrl: string | null = null;

    try {
      if (imageFile) {
        const ext = imageFile.name.split('.').pop() ?? 'jpg';
        const filePath = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('story-images').upload(filePath, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('story-images').getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }

      const { error: insertError } = await supabase.from('stories').insert({
        title: title.trim(),
        teaser: teaser.trim() || null,
        content: content.trim(),
        category,
        status: 'pending',
        user_id: user.id,
        image_url: imageUrl,
      });
      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => navigate('/stories'), 2500);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : err instanceof Error
            ? err.message
            : 'Submission failed.';
      const hint =
        message.includes('teaser')
          ? ' Run supabase/migrations/002_add_teaser_column.sql in Supabase SQL Editor.'
          : '';
      setError(message + hint);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="page submit-page">
        <div className="success-message">
          <h2>Story submitted!</h2>
          <p>Your tale is pending review. We'll notify you once it's live.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page submit-page">
      <header className="page-header">
        <h1>Submit a Story</h1>
        <p className="page-subtitle">
          Share your tale | <span className="telugu-text" lang="te" title="Share your story">మీ కథను పంచుకోండి</span> | Pending admin approval
        </p>
      </header>
      <form className="submit-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input id="title" type="text" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A title that teases..." required maxLength={200} />
        </div>
        <div className="form-group">
          <label htmlFor="teaser">Teaser <span className="label-optional">(recommended)</span></label>
          <textarea
            id="teaser"
            className="textarea textarea-compact"
            value={teaser}
            onChange={(e) => setTeaser(e.target.value)}
            placeholder="A short hook that draws readers in... (150-200 chars ideal)"
            rows={3}
            maxLength={TEASER_MAX_LENGTH}
          />
          <span className="char-count">{teaser.length}/{TEASER_MAX_LENGTH} characters</span>
        </div>
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select id="category" className="select" value={category} onChange={(e) => setCategory(e.target.value as StoryCategory)}>
            {STORY_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="content">Story</label>
          <textarea id="content" className="textarea" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Let the tension build slowly..." rows={20} required />
          <span className="char-count">{content.length} characters (min 200)</span>
        </div>
        <div className="form-group">
          <label htmlFor="image">Cover image (optional)</label>
          <input id="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} className="file-input" />
          <p className="form-hint">Upload a tasteful cover, or leave blank for AI-generated art (coming soon).</p>
        </div>
        <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit for Review'}
        </button>
      </form>
    </div>
  );
}