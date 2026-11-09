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

  try {
    const response = await fetch('/api/state');
    if (response.ok) {
      const remoteState = await response.json();
      for (const [key, value] of Object.entries(remoteState)) {
        if (sharedKeys.has(key)) {
          originalSetItem.call(
            localStorage,
            key,
            typeof value === 'string' ? value : JSON.stringify(value),
          );
        }
      }
      loadedFromCloud = true;
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
