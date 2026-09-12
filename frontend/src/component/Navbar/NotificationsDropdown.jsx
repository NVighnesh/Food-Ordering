import React, { useEffect } from 'react'
import { Box, Badge, IconButton } from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { getNotifications } from '../State/Notification/Action'

export default function NotificationsDropdown() {
  const navigate = useNavigate()
  const dispatch = useDispatch();
  const jwt = useSelector((s) => (s.auth && s.auth.jwt) || null);
  const notifications = useSelector((s) => (s.notification && s.notification.notifications) || []);

  // derive unread count directly from the Redux notifications so the badge
  // matches the Notifications page immediately when the store updates.
  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;

  useEffect(() => {
    if (jwt) dispatch(getNotifications({ jwt }));
    // Poll full notifications every 30s to keep badge in sync with server.
    const t = setInterval(() => {
      if (jwt) dispatch(getNotifications({ jwt }));
    }, 30000);
    return () => clearInterval(t);
  }, [jwt, dispatch]);

  // Note: we intentionally only fetch the unread count here; the full list is shown
  // inside the profile -> Notifications page, so we don't fetch the list in navbar.


  function handleOpen() {
    // When user clicks the bell from the main navbar, go to the profile notifications section
    navigate('/my-profile/notifications')
  }

  // helpers kept for potential future use elsewhere; currently unused here

  return (
    <Box>
      <IconButton onClick={handleOpen} size="large">
        <Badge color="secondary" badgeContent={unreadCount}>
          <NotificationsIcon sx={{ fontSize: '1.5rem' }} />
        </Badge>
      </IconButton>
    </Box>
  )
}
