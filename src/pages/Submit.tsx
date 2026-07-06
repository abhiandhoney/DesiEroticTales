import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { STORY_CATEGORIES, type StoryCategory } from '../types';

export default function Submit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<StoryCategory>(STORY_CATEGORIES[0]);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters.');
      return;
    }
    if (content.trim().length < 200) {
      setError('Story must be at least 200 characters.');
      return;
    }

    setSubmitting(true);
    setError('');

    let imageUrl: string | null = null;

    try {
      if (imageFile) {
        const ext = imageFile.name.split('.').pop() ?? 'jpg';
        const filePath = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('story-images')
          .upload(filePath, imageFile, { upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('story-images')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      // AI image generation placeholder:
      // If no manual upload, call your Edge Function here to generate
      // an image from title+category and store URL in image_url.

      const { error: insertError } = await supabase.from('stories').insert({
        title: title.trim(),
        content: content.trim(),
        category,
        status: 'pending',
        user_id: user.id,
        image_url: imageUrl,
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setTitle('');
      setContent('');
      setImageFile(null);
      setTimeout(() => navigate('/stories'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed.');
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
          Share your tale · మీ కథను పంచుకోండి · Pending admin approval
        </p>
      </header>

      <form className="submit-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A title that teases…"
            required
            maxLength={200}
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            className="select"
            value={category}
            onChange={(e) => setCategory(e.target.value as StoryCategory)}
          >
            {STORY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="content">Story</label>
          <textarea
            id="content"
            className="textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Let the tension build slowly…"
            rows={20}
            required
          />
          <span className="char-count">{content.length} characters (min 200)</span>
        </div>

        <div className="form-group">
          <label htmlFor="image">Cover image (optional)</label>
          <input
            id="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="file-input"
          />
          <p className="form-hint">
            Upload a tasteful cover, or leave blank for AI-generated art (coming soon).
          </p>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={submitting}
        >
          {submitting ? 'Submitting…' : 'Submit for Review'}
        </button>
      </form>
    </div>
  );
}