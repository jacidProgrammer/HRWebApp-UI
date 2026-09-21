import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <section className="panel panel--center" aria-labelledby="not-found-title">
      <h1 id="not-found-title">Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link className="button" to="/employees">
        Go to employees
      </Link>
    </section>
  );
}
