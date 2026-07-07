import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

export default function NotFound() {
  usePageMeta({
    title: 'Page Not Found',
    description: 'The page you requested does not exist on DesiEroticTales.',
    noIndex: true,
  });

  return (
    <div className="page error-page">
      <h2>Page not found</h2>
      <p className="page-subtitle">This path does not exist on DesiEroticTales.</p>
      <Link to="/" className="btn btn-primary">Back to home</Link>
    </div>
  );
}