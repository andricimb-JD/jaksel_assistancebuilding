import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const sharedKeys = new Set([
  'kp_users_list',
  'kp_companies',
  'kp_permits',
  'kp_lkpm',
  'kp_letters',
  'kp_emails',
  'kp_events',
  'kp_consultations',
]);

const originalSetItem = Storage.prototype.setItem;

async function bootstrap() {
  let loadedFromCloud = false;
  let localPermitsToMigrate: string | null = null;

  try {
    const response = await fetch('/api/state');
    if (response.ok) {
      const remoteState = await response.json();

      for (const [key, value] of Object.entries(remoteState)) {
        if (!sharedKeys.has(key)) continue;

        if (key === 'kp_permits' && Array.isArray(value) && value.length === 0) {
          const localPermits = localStorage.getItem('kp_permits');
          if (localPermits) {
            try {
              const parsed = JSON.parse(localPermits);
              if (Array.isArray(parsed) && parsed.length > 0) {
                localPermitsToMigrate = localPermits;
                originalSetItem.call(localStorage, key, localPermits);
                continue;
              }
            } catch {
              // Ignore an invalid local cache and keep the empty cloud state.
            }
          }
        }

        originalSetItem.call(
          localStorage,
          key,
          typeof value === 'string' ? value : JSON.stringify(value),
        );
      }

      loadedFromCloud = true;

      if (localPermitsToMigrate) {
        await fetch('/api/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'kp_permits',
            value: localPermitsToMigrate,
          }),
        });
      }
    }
  } catch {
    // Keep the local cache available when the database is temporarily unreachable.
  }

  if (loadedFromCloud) {
    originalSetItem.call(localStorage, 'kp_clean_empty_slate_v4', 'true');
  }

  Storage.prototype.setItem = function (key: string, value: string) {
    originalSetItem.call(this, key, value);

    if (this === localStorage && sharedKeys.has(key)) {
      fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      }).catch(() => undefined);
    }
  };

  createRoot(document.getElementById('root')!).render(<App />);
}

bootstrap();
