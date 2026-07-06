import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page error-page">
      <h2>Page not found</h2>
      <p className="page-subtitle">This path does not exist on DesiEroticTales.</p>
      <Link to="/" className="btn btn-primary">Back to home</Link>
    </div>
  );
}