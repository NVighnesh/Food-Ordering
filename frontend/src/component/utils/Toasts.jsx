import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import CloseIcon from '@mui/icons-material/Close';

// Simple toast presenter reading from notification slice (local notifications)
// Expects notifications added via addLocalNotification with type 'toast' and data.level
// Levels: success | error | warn | info

const levelColors = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  warn: 'bg-amber-600',
  info: 'bg-blue-600'
};

export const Toasts = () => {
  const notifications = useSelector(state => (state.notification && state.notification.notifications) || []);
  const dispatch = useDispatch();
  const toasts = (notifications || []).filter(n => n.type === 'toast');

  const handleDismiss = React.useCallback((id) => {
    // Soft-delete locally by dispatching a filtered replacement (no specialized action defined)
    dispatch({ type: 'DELETE_NOTIFICATION_SUCCESS', payload: id });
  }, [dispatch]);

  React.useEffect(() => {
    const timers = toasts.map(t => setTimeout(() => handleDismiss(t.id), 2000));
    return () => { timers.forEach(id => clearTimeout(id)); };
  }, [toasts, handleDismiss]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 max-w-sm w-[90%] sm:w-[380px] items-center">
      {toasts.slice(0,5).map(t => {
        const lvl = (t.data && t.data.level) || 'info';
        const color = levelColors[lvl] || levelColors.info;
        return (
          <div
            key={t.id}
            className={`text-white shadow-lg rounded-md px-4 py-3 flex items-start gap-3 w-full animate-slide-in ${color}`}
            style={{ animation: 'toastSlide .35s ease-out' }}
          >
            <div className="flex-1">
              <p className="font-semibold text-sm leading-snug">{t.title}</p>
              {t.body && <p className="mt-0.5 text-xs opacity-90">{t.body}</p>}
            </div>
            <button
              onClick={() => handleDismiss(t.id)}
              className="opacity-80 hover:opacity-100 transition"
              aria-label="dismiss"
            >
              <CloseIcon fontSize="small" />
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes toastSlide { from { transform: translateY(-8px); opacity:0 } to { transform: translateY(0); opacity:1 } }
      `}</style>
    </div>
  );
};

export default Toasts;