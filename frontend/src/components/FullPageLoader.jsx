import { LoaderCircle } from 'lucide-react';
import useSlowHint from '../hooks/useSlowHint';

export default function FullPageLoader() {
  const slow = useSlowHint(true);
  return (
    <div className="full-loader">
      <LoaderCircle className="spin" size={36} />
      <p>{slow ? 'Waking up the server (free hosting), this can take up to a minute…' : 'Loading…'}</p>
    </div>
  );
}
