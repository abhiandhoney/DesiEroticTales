import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import { ABOUT_META } from '../lib/seoMeta';
import { buildOrganizationJsonLd, buildWebPageJsonLd } from '../lib/seo';
import SiteOverview from '../components/SiteOverview';

const LAST_UPDATED = 'July 8, 2026';
const CONTACT_EMAIL = 'contact@desierotictales.online';
const REPORTS_EMAIL = 'reports@desierotictales.online';

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
      description="How DesiEroticTales collects, uses, and protects your personal information."
      path="/privacy-policy"
    >
      <p><strong>Last updated:</strong> {LAST_UPDATED}</p>
      <p>
        DesiEroticTales (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates{' '}
        <a href="https://desierotictales.online">desierotictales.online</a>, a platform for
        adults to read and share Telugu and Desi erotic fiction. This Privacy Policy explains what
        information we collect, how we use it, and the choices available to you.
      </p>

      <h2>Who this applies to</h2>
      <p>
        This policy applies to visitors, registered readers, and writers who use our website. The
        site is intended for adults aged 18 and over only.
      </p>

      <h2>Information we collect</h2>
      <p>Depending on how you use the site, we may collect:</p>
      <ul>
        <li>
          <strong>Account information</strong> — when you sign in, we receive basic profile
          details from your chosen sign-in provider (such as your name, email address, and profile
          picture).
        </li>
        <li>
          <strong>Profile and writer information</strong> — username, display name, biography,
          avatar, and other details you choose to add to your public writer profile.
        </li>
        <li>
          <strong>Content you submit</strong> — stories, cover images, collections, and related
          metadata you provide for publication or review.
        </li>
        <li>
          <strong>Engagement information</strong> — story views, appreciations, follows, reading
          preferences, and similar activity used to operate community features and rankings.
        </li>
        <li>
          <strong>Technical information</strong> — browser type, device information, approximate
          location derived from your connection, pages visited, and referral source, collected
          through standard server logs and analytics tools.
        </li>
        <li>
          <strong>Communications</strong> — messages you send us, including content reports and
          support enquiries.
        </li>
        <li>
          <strong>Preferences stored on your device</strong> — such as age-verification status and
          cookie choices, saved locally in your browser.
        </li>
      </ul>

      <h2>How we use your information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Provide, maintain, and improve the website and its features</li>
        <li>Create and manage accounts, writer profiles, and story submissions</li>
        <li>Review, publish, moderate, and remove content in line with our guidelines</li>
        <li>Display community features such as rankings, appreciations, and writer pages</li>
        <li>Respond to enquiries, reports, and support requests</li>
        <li>Protect the security and integrity of the platform</li>
        <li>Understand how the site is used so we can improve the reading experience</li>
        <li>Comply with applicable legal obligations</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>How information is shared</h2>
      <p>We may share information only where necessary to run the service:</p>
      <ul>
        <li>
          <strong>Service providers</strong> — trusted partners who help us host the site, manage
          accounts, store content, deliver analytics, or display advertising. These providers
          process data on our behalf and only as needed to perform their services.
        </li>
        <li>
          <strong>Public information</strong> — writer profiles, published stories, appreciations,
          and other content you choose to make public will be visible to other visitors.
        </li>
        <li>
          <strong>Legal and safety reasons</strong> — where required by law, to enforce our terms,
          to respond to lawful requests, or to protect users, the public, or the platform.
        </li>
      </ul>

      <h2>Retention</h2>
      <p>
        We keep personal information for as long as your account is active or as needed to provide
        the service, resolve disputes, enforce our policies, and meet legal requirements. You may
        request deletion of account-related information by contacting us.
      </p>

      <h2>Your choices and rights</h2>
      <ul>
        <li>Update your profile details at any time from your account dashboard.</li>
        <li>Manage non-essential cookies through our cookie banner or your browser settings.</li>
        <li>Sign out of your account whenever you choose.</li>
        <li>Request access to, correction of, or deletion of personal information by emailing us.</li>
      </ul>
      <p>
        Depending on where you live, you may have additional privacy rights under local law. We
        will respond to valid requests within a reasonable time.
      </p>

      <h2>Security</h2>
      <p>
        We use reasonable technical and organisational measures to protect personal information.
        No method of transmission or storage is completely secure, and we cannot guarantee absolute
        security.
      </p>

      <h2>Children</h2>
      <p>
        DesiEroticTales is strictly for adults aged 18 and over. We do not knowingly collect
        personal information from anyone under 18. If you believe a minor has provided us with
        personal information, please contact us so we can take appropriate action.
      </p>

      <h2>International visitors</h2>
      <p>
        If you access the site from outside India, your information may be processed in countries
        where our service providers operate. By using the site, you understand that your information
        may be transferred and processed in those locations.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. The &ldquo;Last updated&rdquo; date at
        the top of this page will change when we do. Continued use of the site after changes are
        posted means you accept the revised policy.
      </p>

      <h2>Contact</h2>
      <p>
        For privacy questions or requests, email{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalPageShell>
  );
}

export function CookiePolicyPage() {
  return (
    <LegalPageShell
      title="Cookie Policy"
      description="How DesiEroticTales uses cookies and similar technologies."
      path="/cookie-policy"
    >
      <p><strong>Last updated:</strong> {LAST_UPDATED}</p>
      <p>
        This Cookie Policy explains how DesiEroticTales uses cookies and similar technologies when
        you visit <a href="https://desierotictales.online">desierotictales.online</a>. It should be
        read alongside our <Link to="/privacy-policy">Privacy Policy</Link>.
      </p>

      <h2>What are cookies?</h2>
      <p>
        Cookies are small text files stored on your device when you visit a website. They help
        websites remember your preferences, keep you signed in, and understand how visitors use the
        site. We also use similar technologies such as local storage for certain preferences.
      </p>

      <h2>Essential cookies and storage</h2>
      <p>These are required for the site to function properly. They cannot be switched off in our systems.</p>
      <ul>
        <li><strong>Sign-in and security</strong> — to keep your account session active and secure.</li>
        <li><strong>Age verification</strong> — to remember that you confirmed you are 18 or older.</li>
        <li><strong>Cookie preferences</strong> — to remember whether you accepted or declined optional cookies.</li>
        <li><strong>Site functionality</strong> — to support core features such as navigation and form submissions.</li>
      </ul>

      <h2>Optional cookies</h2>
      <p>
        With your consent, we may use additional cookies and similar technologies to measure site
        performance, understand traffic patterns, and support advertising on the site. These are not
        required to read stories or use essential account features.
      </p>
      <ul>
        <li><strong>Analytics</strong> — to understand how visitors find and use the site so we can improve it.</li>
        <li><strong>Advertising</strong> — to display relevant ads and measure ad performance.</li>
        <li><strong>Comments and embedded features</strong> — where interactive features are enabled, related services may set their own cookies.</li>
      </ul>
      <p>
        When you first visit, our cookie banner lets you accept all cookies or continue with
        essential cookies only.
      </p>

      <h2>Managing cookies</h2>
      <p>You can control cookies in several ways:</p>
      <ul>
        <li>Use the cookie banner on your first visit, or clear site data to see it again.</li>
        <li>Adjust your browser settings to block or delete cookies.</li>
        <li>Use private browsing modes, noting that some features may not work correctly.</li>
      </ul>
      <p>
        Blocking essential cookies may prevent you from signing in or using parts of the site.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this Cookie Policy from time to time. Material changes will be reflected in
        the date shown at the top of this page.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about cookies? Email{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalPageShell>
  );
}

export function TermsOfUsePage() {
  return (
    <LegalPageShell
      title="Terms of Use"
      description="Terms and conditions for using DesiEroticTales."
      path="/terms-of-use"
    >
      <p><strong>Last updated:</strong> {LAST_UPDATED}</p>
      <p>
        These Terms of Use (&ldquo;Terms&rdquo;) govern your access to and use of DesiEroticTales
        at <a href="https://desierotictales.online">desierotictales.online</a>. By using the site,
        you agree to these Terms. If you do not agree, please do not use the site.
      </p>

      <h2>Eligibility</h2>
      <p>
        You must be at least 18 years old to use DesiEroticTales. The site contains mature adult
        fiction and is not suitable for minors. By entering and using the site, you confirm that
        you meet this age requirement.
      </p>

      <h2>The service</h2>
      <p>
        DesiEroticTales is a reading platform for Telugu and Desi erotic fiction. We publish
        community-written stories, writer profiles, rankings, and related features. We may add,
        change, or remove features at any time.
      </p>

      <h2>Accounts</h2>
      <ul>
        <li>You are responsible for activity that occurs under your account.</li>
        <li>You must provide accurate profile information and keep your account credentials secure.</li>
        <li>Usernames must be unique and must not impersonate others or mislead readers.</li>
        <li>We may suspend or terminate accounts that violate these Terms or our content standards.</li>
      </ul>

      <h2>Reader conduct</h2>
      <p>When using the site, you agree not to:</p>
      <ul>
        <li>Use the site if you are under 18</li>
        <li>Harass, threaten, or abuse writers, readers, or staff</li>
        <li>Attempt to disrupt, scrape, overload, or compromise the platform</li>
        <li>Circumvent access controls, moderation systems, or security measures</li>
        <li>Use automated tools to extract content at scale without permission</li>
        <li>Misuse community features such as appreciations, follows, or rankings</li>
      </ul>

      <h2>Writer submissions</h2>
      <p>If you submit stories for publication, you also agree that:</p>
      <ul>
        <li>You own the content you submit or have the right to publish it.</li>
        <li>Your work is original or properly attributed; plagiarism is not permitted.</li>
        <li>All characters depicted in sexual situations are adults aged 18 or older.</li>
        <li>You will not submit content involving minors, non-consensual acts presented approvingly, illegal activity, hate speech, spam, or material that infringes others&rsquo; rights.</li>
        <li>Submitted stories may be reviewed, edited for formatting, rejected, unpublished, or removed at our discretion.</li>
        <li>We may display your stories, pen name, profile, and related metadata on the site and in promotional materials for the platform.</li>
      </ul>

      <h2>Intellectual property</h2>
      <p>
        The DesiEroticTales name, branding, site design, and original platform content are owned by
        us or our licensors. Writers retain ownership of the stories they create, but grant us a
        non-exclusive licence to host, display, distribute, and promote submitted work on and in
        connection with the site.
      </p>
      <p>
        You may share links to stories and quote brief excerpts with attribution. Republication of
        full stories outside the platform requires the writer&rsquo;s permission unless otherwise
        stated.
      </p>

      <h2>Content moderation</h2>
      <p>
        We reserve the right to review, restrict, or remove any content or account that we believe
        violates these Terms, applicable law, or community standards. If you see content that
        should be reviewed, please <Link to="/report-content">report it</Link>.
      </p>

      <h2>Disclaimer</h2>
      <p>
        DesiEroticTales is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis.
        Fiction published on the site is the work of individual writers and does not represent our
        views. We do not guarantee uninterrupted access, error-free operation, or that every story
        will meet your expectations.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, DesiEroticTales and its operators will not be
        liable for indirect, incidental, special, consequential, or punitive damages arising from
        your use of the site, user-generated content, or third-party services linked or embedded on
        the platform.
      </p>

      <h2>Third-party services</h2>
      <p>
        The site may include links, sign-in options, analytics, advertising, or other services
        provided by third parties. Your use of those services may be subject to their own terms and
        policies. We are not responsible for third-party services we do not control.
      </p>

      <h2>Changes to these Terms</h2>
      <p>
        We may revise these Terms from time to time. Updated Terms will be posted on this page with
        a new &ldquo;Last updated&rdquo; date. Continued use of the site after changes take effect
        constitutes acceptance of the revised Terms.
      </p>

      <h2>Governing law</h2>
      <p>
        These Terms are governed by the laws of India, without regard to conflict-of-law principles.
        Any dispute arising from these Terms or your use of the site shall be subject to the
        exclusive jurisdiction of the courts located in India, unless applicable law requires
        otherwise.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these Terms? Email{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
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
      <p>
        We welcome questions about the site, writer accounts, partnerships, and press enquiries.
        Choose the option that best fits your request.
      </p>

      <h2>General enquiries</h2>
      <p>
        Email us at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        We aim to respond within a few business days.
      </p>

      <h2>Report a story or policy concern</h2>
      <p>
        If you believe a story violates our guidelines — for example, by depicting minors, promoting
        non-consensual acts, containing plagiarism, or including illegal material — please use our{' '}
        <Link to="/report-content">report content</Link> form. Include the story URL and a clear
        description of the issue.
      </p>

      <h2>Writers</h2>
      <ul>
        <li>Check submission status and manage your work from your <Link to="/profile">profile dashboard</Link>.</li>
        <li>Ready to publish? <Link to="/submit">Submit a story</Link> for editorial review.</li>
        <li>For account or username issues, email {CONTACT_EMAIL} from the address linked to your sign-in.</li>
      </ul>

      <h2>What to include in your message</h2>
      <p>
        To help us assist you quickly, include your username (if applicable), the page or story URL
        involved, and a concise description of your request.
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
    window.location.href = `mailto:${REPORTS_EMAIL}?subject=${subject}&body=${body}`;
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
          placeholder="https://desierotictales.online/category-slug/story-slug"
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
          placeholder="Please describe the issue clearly — for example, prohibited themes, plagiarism, spam, or a broken page."
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
          <li>Original slow-burn erotic fiction across 20+ categories</li>
          <li>Writer profiles with community rankings and appreciations</li>
          <li>Cover illustrations and story image galleries</li>
          <li>New stories added regularly — browse by category or writer</li>
        </ul>
        <h2>How to cite our stories</h2>
        <p>When referencing a story in articles, citations, or social posts, use this format:</p>
        <p>
          <cite>
            &ldquo;Story Title&rdquo; — a slow-burn [Category] story on DesiEroticTales
            (https://desierotictales.online/category-slug/story-slug)
          </cite>
        </p>
        <p>Each story page includes a ready-made citation block at the bottom.</p>
        <h2>For writers</h2>
        <p>
          Sign in and <Link to="/submit">submit your tale</Link> for review. Include a teaser
          so readers can discover your story easily. All submissions are reviewed before publication.
        </p>
        <h2>Contact</h2>
        <p>
          General enquiries: <Link to="/contact">contact us</Link>.
          Content concerns: <Link to="/report-content">report content</Link>.
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
      description="Report content that violates DesiEroticTales guidelines."
      path="/report-content"
    >
      <p>
        We take content standards seriously. Use this form to flag stories or pages that may violate
        our <Link to="/terms-of-use">Terms of Use</Link> or community guidelines.
      </p>

      <h2>What you can report</h2>
      <ul>
        <li>Depiction of minors or characters presented as under 18</li>
        <li>Non-consensual sexual content presented approvingly</li>
        <li>Plagiarism or unauthorised republication</li>
        <li>Spam, malware links, or deceptive content</li>
        <li>Harassment, hate speech, or threats</li>
        <li>Other material you believe is unlawful or harmful</li>
      </ul>

      <h2>How to submit a report</h2>
      <p>Please include:</p>
      <ol>
        <li>The full story URL (for example, <code>/aunty-stories/your-story-slug</code>)</li>
        <li>A clear description of the problem</li>
        <li>Your contact email, if you would like a follow-up</li>
      </ol>
      <p>
        Reports are reviewed as promptly as possible. We may remove content, restrict accounts, or
        take other action where appropriate. Not every report will result in removal, but each valid
        report helps keep the community safe.
      </p>

      <ReportForm />

      <p className="legal-note">
        Prefer email? Write to{' '}
        <a href={`mailto:${REPORTS_EMAIL}`}>{REPORTS_EMAIL}</a> with the same details.
      </p>
    </LegalPageShell>
  );
}