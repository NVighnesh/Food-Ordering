import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, Typography, Divider, Chip, IconButton, Avatar, Button } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import DoneIcon from '@mui/icons-material/Done';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import EventIcon from '@mui/icons-material/Event';
import PaymentIcon from '@mui/icons-material/Payment';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationRead, deleteNotification, clearNotifications } from '../State/Notification/Action';

const typeMap = {
  order_placed: { icon: <ReceiptLongIcon />, color: 'primary', title: 'Order placed' },
  order_status: { icon: <ReceiptLongIcon />, color: 'secondary', title: 'Order update' },
  new_restaurant: { icon: <RestaurantIcon />, color: 'success', title: 'New restaurant' },
  event: { icon: <EventIcon />, color: 'info', title: 'New event' },
  payment: { icon: <PaymentIcon />, color: 'success', title: 'Payment' },
};

const NotificationRow = ({ n, onMark, onDelete, onOpen }) => {
  const meta = typeMap[n.type] || { icon: <NotificationsActiveIcon />, color: 'default', title: n.title };
  // common helpers
  const orderId = n?.data?.orderId || n?.orderId || n?.data?.id || (n.data && n.data.order && n.data.order.id);
  const orderStatus = n?.data?.orderStatus || n?.data?.status || n.orderStatus;
  const event = n?.data?.event || n?.data?.eventId || n?.data;

  return (
    <div onClick={() => onOpen && onOpen(n)} className={`flex justify-between items-start py-3 cursor-pointer ${n.read ? 'opacity-70' : ''}`}>
      <div className="flex gap-3">
        <Avatar sx={{ bgcolor: 'transparent' }}>{meta.icon}</Avatar>
        <div>
          <div className="font-medium">{n.title || meta.title}</div>
          <div className="text-sm text-gray-400">{n.body}</div>

          {/* Additional contextual details for orders and events */}
          { (n.type === 'order_placed' || n.type === 'order_status') && (
            <div className="mt-1 flex items-center gap-2">
              {orderId && <Chip label={`Order #${orderId}`} size="small" />}
              {orderStatus && <Chip label={String(orderStatus)} size="small" color="secondary" />}
            </div>
          ) }

          { n.type === 'event' && (
            <div className="mt-1 text-sm text-gray-300">
              {event && (typeof event === 'string' || typeof event === 'number') ? (
                <span>Event id: {event}</span>
              ) : event && event.name ? (
                <div>
                  <div className="font-medium">{event.name}</div>
                  {event.date && <div className="text-xs text-gray-400">{new Date(event.date).toLocaleString()}</div>}
                </div>
              ) : null}
            </div>
          ) }

          <div className="text-xs text-gray-500 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          {!n.read && <IconButton size="small" onClick={(e) => { e.stopPropagation(); onMark(n.id); }} title="Mark read"><DoneIcon /></IconButton>}
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(n.id); }} title="Delete"><DeleteIcon /></IconButton>
        </div>
        <div>
          {/* quick action button */}
          <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); onOpen(n); }}>
            View
          </Button>
        </div>
      </div>
    </div>
  );
};

const Notifications = () => {
  const dispatch = useDispatch();
  const notification = useSelector(state => state.notification);
  const { notifications = [] } = notification || {};
  const navigate = useNavigate();
  const authJwt = useSelector((s) => (s.auth && s.auth.jwt) || null);

  useEffect(() => {
    if (authJwt) dispatch(getNotifications({ jwt: authJwt }));
  }, [dispatch, authJwt]);

  // probe/debugging removed to avoid exposing tokens/response in the UI

  const handleMark = (id) => dispatch(markNotificationRead({ jwt: authJwt, id }));
  const handleDelete = (id) => dispatch(deleteNotification({ jwt: authJwt, id }));
  const handleClear = () => {
    if (window.confirm('Clear all notifications?')) dispatch(clearNotifications({ jwt: authJwt }));
  };

  const handleOpen = (n) => {
    // mark read when opened
  if (!n.read) dispatch(markNotificationRead({ jwt: authJwt, id: n.id }));
    // navigate on certain types
    if (n.type === 'order_placed' || n.type === 'order_status') {
      // assume payload contains orderId
      const orderId = n?.data?.orderId || n?.orderId || n?.data?.id;
      if (orderId) {
        navigate('/my-profile/orders');
        // optional: scroll to order in Orders page if you implement anchors
      } else {
        navigate('/my-profile/orders');
      }
      return;
    }
    if (n.type === 'new_restaurant') {
      navigate('/'); // go to home where new restaurants are listed
      return;
    }
    if (n.type === 'event') {
      navigate('/my-profile/events');
      return;
    }
    if (n.type === 'payment') {
      navigate('/my-profile/payment');
      return;
    }
  };

  return (
    <div className="p-6">
      <Card className="max-w-4xl mx-auto" sx={{ background: '#111827', color: '#fff' }}>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <NotificationsActiveIcon />
              <div>
                <Typography variant="h6">Notifications</Typography>
                <Typography variant="body2" color="text.secondary">Recent activity and updates</Typography>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Chip label={`Unread: ${notifications.filter(n => !n.read).length}`} />
              <button className="btn btn-sm btn-outline" onClick={handleClear}>Clear</button>
            </div>
          </div>

          <Divider sx={{ my: 2 }} />

          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div>
                <Typography className="text-gray-400">No notifications</Typography>
                    null
              </div>
            ) : (
              // group by date: Today / Yesterday / Older
              (() => {
                const groups = { Today: [], Yesterday: [], Older: [] };
                const now = new Date();
                notifications.forEach(n => {
                  const d = n.createdAt ? new Date(n.createdAt) : null;
                  if (!d) { groups.Older.push(n); return; }
                  const isToday = d.toDateString() === now.toDateString();
                  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
                  const isYesterday = d.toDateString() === yesterday.toDateString();
                  if (isToday) groups.Today.push(n);
                  else if (isYesterday) groups.Yesterday.push(n);
                  else groups.Older.push(n);
                });
                return Object.entries(groups).map(([label, items]) => (
                  items.length === 0 ? null : (
                    <div key={label} className="space-y-2">
                      <div className="text-sm text-gray-400 font-semibold">{label}</div>
                      <div className="space-y-2">
                        {items.map(n => <NotificationRow key={n.id || Math.random()} n={n} onMark={handleMark} onDelete={handleDelete} onOpen={handleOpen} />)}
                      </div>
                    </div>
                  )
                ));
              })()
            )}
          </div>
          {/* Dev inspector removed to avoid displaying raw tokens/response in the UI */}
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
