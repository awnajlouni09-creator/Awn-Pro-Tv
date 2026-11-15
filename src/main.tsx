import './utils/envGuard';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-[#141414] text-white flex flex-col items-center justify-center p-6 text-center gap-4"
        >
          <h1 className="text-2xl font-black text-[#e50914]">Awn Tv pro</h1>
          <p className="text-sm text-zinc-300 max-w-md">
            حدث تعارض مؤقت أثناء تحميل الواجهة. اضغط أدناه لإعادة تنشيط التطبيق.
          </p>
          <button
            type="button"
            onClick={() => {
              try {
                if ('caches' in window) {
                  caches.keys().then((keys) => {
                    keys.forEach((k) => caches.delete(k));
                  });
                }
              } catch {
                // ignore cache cleanup failure
              }
              window.location.reload();
            }}
            className="px-6 py-2.5 bg-[#e50914] hover:bg-[#ff1a1a] text-white font-bold rounded-lg cursor-pointer transition-colors"
          >
            إعادة تحميل التطبيق
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

try {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    let hasController = !!navigator.serviceWorker.controller;
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hasController && !reloading) {
        reloading = true;
        window.location.reload();
      }
      hasController = true;
    });
  }

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      const checkForUpdate = () => {
        registration.update().catch(() => {});
      };
      checkForUpdate();
      window.addEventListener('focus', checkForUpdate);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          checkForUpdate();
        }
      });
    },
  });
} catch {
  // Never block rendering if service worker registration fails in restricted hosts
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
}
