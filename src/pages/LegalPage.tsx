import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import { ABOUT_META } from '../lib/seoMeta';
import { buildOrganizationJsonLd, buildWebPageJsonLd } from '../lib/seo';
import SiteOverview from '../components/SiteOverview';

interface LegalPageProps {
  title: string;
  description: string;
  path: string;
  children: React.ReactNode;
}

export function LegalPageShell({ title, description, path, children }: LegalPageProps) {
  usePageMeta({ title, description, path, type: 'website' });
  return (
    <div className="page legal-page">
      <header className="page-header">
        <h1>{title}</h1>
      </header>
      <div className="legal-content">{children}</div>
      <p className="legal-back">
        <Link to="/">&larr; Back to home</Link>
      </p>
    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      description="How DesiEroticTales handles your data, sign-in, and cookies."
      path="/privacy-policy"
    >
      <p><strong>Last updated:</strong> July 7, 2026</p>
      <h2>What we collect</h2>
      <ul>
        <li>Google account identifier and email when you sign in (via Supabase Auth).</li>
        <li>Profile information you provide: username, display name, bio, avatar.</li>
        <li>Stories you submit and engagement data (views, appreciations, follows).</li>
        <li>Age verification preference stored locally in your browser.</li>
      </ul>
      <h2>How we use it</h2>
      <p>To operate the site: publishing stories, moderation, writer profiles, and community features. We do not sell personal data.</p>
      <h2>Third parties</h2>
      <ul>
        <li><strong>Supabase</strong> — authentication and database hosting.</li>
        <li><strong>Google</strong> — OAuth sign-in.</li>
        <li><strong>Disqus</strong> — optional comments (if enabled).</li>
        <li><strong>Adsterra</strong> — optional advertisements (if enabled).</li>
        <li><strong>Cloudflare</strong> — hosting and security.</li>
      </ul>
      <h2>Your choices</h2>
      <p>You may delete stories while pending/rejected, edit your profile, and sign out at any time. Contact us to request account-related help.</p>
    </LegalPageShell>
  );
}

export function CookiePolicyPage() {
  return (
    <LegalPageShell
      title="Cookie Policy"
      description="Cookies and local storage used by DesiEroticTales."
      path="/cookie-policy"
    >
      <h2>Essential</h2>
      <ul>
        <li><strong>Session / auth</strong> — Supabase keeps you signed in securely.</li>
        <li><strong>Age gate</strong> — localStorage remembers that you confirmed 18+.</li>
        <li><strong>Cookie consent</strong> — localStorage stores your banner choice.</li>
      </ul>
      <h2>Optional</h2>
      <ul>
        <li><strong>Advertising</strong> — third-party ad networks may set cookies if ads are enabled and you accept cookies.</li>
        <li><strong>Disqus</strong> — comment embed may set cookies when you view or post comments.</li>
      </ul>
      <p>You can clear site data in your browser settings at any time.</p>
    </LegalPageShell>
  );
}

export function ContactPage() {
  return (
    <LegalPageShell
      title="Contact Us"
      description="Get in touch with the DesiEroticTales team."
      path="/contact"
    >
      <p>For general enquiries, partnership requests, or account help:</p>
      <ul>
        <li>Use the <Link to="/report-content">report content</Link> form for story or policy issues.</li>
        <li>Writers: check your <Link to="/profile">profile dashboard</Link> for submission status.</li>
      </ul>
      <p className="legal-note">
        We respond to valid reports and writer support requests as soon as possible. Include story links
        (category/slug URLs) when reporting content.
      </p>
    </LegalPageShell>
  );
}

function ReportForm() {
  const [url, setUrl] = useState('');
  const [details, setDetails] = useState('');
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = encodeURIComponent(`Reported URL: ${url}\n\nDetails:\n${details}`);
    const subject = encodeURIComponent('DesiEroticTales content report');
    window.location.href = `mailto:reports@desierotictales.com?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <form className="legal-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="report-url">Story URL</label>
        <input
          id="report-url"
          className="input"
          type="url"
          required
          placeholder="https://yoursite.com/category/story-slug"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="report-details">What is wrong?</label>
        <textarea
          id="report-details"
          className="textarea"
          required
          rows={5}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary">Send report via email</button>
      {sent && <p className="form-hint">Your email client should open with the report draft.</p>}
    </form>
  );
}

export function AboutPage() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  usePageMeta({
    title: ABOUT_META.title,
    description: ABOUT_META.description,
    keywords: ABOUT_META.keywords,
    path: ABOUT_META.path,
    jsonLd: [
      buildOrganizationJsonLd(origin),
      buildWebPageJsonLd(ABOUT_META.title, ABOUT_META.description, ABOUT_META.path),
    ],
  });

  return (
    <div className="page legal-page about-page">
      <header className="page-header">
        <h1>About DesiEroticTales</h1>
        <p className="page-subtitle">Slow-burn Telugu and Desi erotic fiction — free to read.</p>
      </header>
      <div className="legal-content">
        <SiteOverview />
        <h2>What we publish</h2>
        <ul>
          <li>Writer profiles with community rankings and appreciations</li>
          <li>AI-generated cover images and story galleries</li>
          <li>New stories added regularly — browse by category or writer</li>
        </ul>
        <h2>How to cite our stories</h2>
        <p>When referencing a story in articles, AI responses, or social posts, use this format:</p>
        <p>
          <cite>
            &ldquo;Story Title&rdquo; — a slow-burn [Category] story on DesiEroticTales
            (https://desierotictales.com/category-slug/story-slug)
          </cite>
        </p>
        <p>Each story page includes a ready-made citation block at the bottom.</p>
        <h2>For writers</h2>
        <p>
          Sign in and <Link to="/submit">submit your tale</Link> for review. Include a teaser
          (quick summary) so readers and AI tools can discover your story easily.
        </p>
        <h2>Contact</h2>
        <p>
          Questions or partnership enquiries: <Link to="/contact">contact us</Link>.
          Content issues: <Link to="/report-content">report content</Link>.
        </p>
      </div>
      <p className="legal-back">
        <Link to="/">&larr; Back to home</Link>
      </p>
    </div>
  );
}

export function ReportContentPage() {
  return (
    <LegalPageShell
      title="Report Content"
      description="Report inappropriate or problematic content on DesiEroticTales."
      path="/report-content"
    >
      <p>If a story violates our guidelines (non-consensual themes, minors, spam, plagiarism, or illegal content), please report it with:</p>
      <ol>
        <li>The story URL (e.g. <code>/aunty-sex-stories/your-story-slug</code>)</li>
        <li>A brief description of the issue</li>
        <li>Your contact email (optional, for follow-up)</li>
      </ol>
      <ReportForm />
    </LegalPageShell>
  );
}