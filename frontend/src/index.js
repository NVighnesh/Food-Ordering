import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './component/State/store';
import { logout, getUser } from './component/State/Authentication/Action';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
    <Provider store={store}>
       <App />
    </Provider>
   
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Auto-logout helpers: when the tab becomes hidden/inactive for a configured
// timeout (default 3 minutes) or when the page is unloaded, dispatch logout.
// This is registered once during app startup.
(() => {
  const INACTIVITY_MS = 3 * 60 * 1000; // 3 minutes
  let inactivityTimer = null;
  let lastActivity = Date.now();

  // Hydrate auth/profile on initial load if jwt exists (user refreshed page)
  try {
    const existingJwt = localStorage.getItem('jwt') || sessionStorage.getItem('jwt');
    if (existingJwt) {
      // Defer slightly to allow store subscribers (StrictMode double-mount safe)
      setTimeout(() => {
        try { store.dispatch(getUser(existingJwt)); } catch (e) { /* ignore */ }
      }, 0);
    }
  } catch (e) { /* ignore */ }

  function clearInactivityTimer() {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
  }

  function startInactivityTimer() {
    clearInactivityTimer();
    inactivityTimer = setTimeout(() => {
      // Only logout if there has truly been no user activity for the window
      if (Date.now() - lastActivity >= INACTIVITY_MS) {
        try { store.dispatch(logout()); } catch (e) { /* ignore */ }
      }
    }, INACTIVITY_MS + 250); // small buffer
  }

  // When page visibility changes (user switches tab / minimizes), start or
  // clear the inactivity timer. If the page becomes hidden, start the timer;
  // if visible again, clear it.
  function handleVisibilityChange() {
    if (document.hidden) {
      startInactivityTimer();
    } else {
      clearInactivityTimer();
    }
  }

  // When the window is about to unload (tab closed or page refreshed), call
  // logout synchronously where possible. Keep this lightweight to avoid
  // blocking unload; we primarily rely on localStorage/session cleanup in
  // the logout action.
  // We no longer forcibly logout on every unload (that caused login loss on refresh).
  // Instead, rely on inactivity + explicit user logout. If you want to force
  // logout only on real tab close (not refresh/navigation), you could detect
  // the Navigation API or set a flag before calling window.location.*.

  const activityEvents = ['mousemove','keydown','mousedown','touchstart','scroll'];
  function markActivity() { lastActivity = Date.now(); clearInactivityTimer(); if (document.hidden) return; startInactivityTimer(); }

  // Register listeners
  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange, false);
    // Also listen for blur as some browsers don't set document.hidden on minimize
    window.addEventListener('blur', () => { startInactivityTimer(); }, false);
    window.addEventListener('focus', () => { clearInactivityTimer(); }, false);
    activityEvents.forEach(evt => window.addEventListener(evt, markActivity, { passive: true }));
    // kick off timer only after first activity (or immediately if visible)
    if (!document.hidden) startInactivityTimer();
  }
})();
