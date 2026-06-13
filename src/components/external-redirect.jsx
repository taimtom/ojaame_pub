import { useEffect } from 'react';

export function ExternalRedirect({ to }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return null;
}
