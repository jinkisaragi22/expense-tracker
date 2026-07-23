import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, apiError } from '../api/client';
import { useAuthStore } from '../store/auth';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleButton({ onError }) {
  const ref = useRef(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    function init() {
      if (cancelled) return;
      if (!window.google?.accounts?.id) {
        setTimeout(init, 150);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async ({ credential }) => {
          try {
            const { data } = await api.post('/auth/google', { credential });
            setAuth(data);
            navigate('/');
          } catch (err) {
            onError?.(apiError(err));
          }
        },
      });
      window.google.accounts.id.renderButton(ref.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        width: 300,
      });
    }
    init();
    return () => { cancelled = true; };
  }, [navigate, onError, setAuth]);

  if (!CLIENT_ID) return null;

  return (
    <div>
      <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
      <div ref={ref} className="flex justify-center" />
    </div>
  );
}
