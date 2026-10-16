import { useEffect, useState } from 'react';

// Returns true once `active` has stayed true for `after` ms.
// Used to explain the delay when the free-tier server is waking up.
export default function useSlowHint(active, after = 4000) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!active) return undefined;
    const id = setTimeout(() => setSlow(true), after);
    return () => {
      clearTimeout(id);
      setSlow(false);
    };
  }, [active, after]);
  return active && slow;
}
