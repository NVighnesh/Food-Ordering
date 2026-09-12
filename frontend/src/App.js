import { ThemeProvider } from "@emotion/react";
import "./App.css";
import { darkTheme } from "./Theme/DarkTheme";
import { CssBaseline } from "@mui/material";
import { useEffect } from "react";
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import { getUser } from "./component/State/Authentication/Action";
import { findCart } from "./component/State/Cart/Action";
import Routers from "./Routers/Routers";
import Toasts from './component/utils/Toasts';
import { getRestaurantByUserId } from "./component/State/Restaurant/Action";

// Keys we consider application-auth related and will clear on timeout/unload.
const APP_LOCAL_KEYS = [
  'jwt',
  'user_profile',
  'user_role',
  'local_cart_v1',
  'localNotifications',
  'favorites'
];

function clearAppLocalStorage() {
  try {
  // If a payment is in progress (external redirect), don't clear storage.
  const paymentFlag = localStorage.getItem('payment_in_progress');
  if (paymentFlag) return;
  APP_LOCAL_KEYS.forEach(k => localStorage.removeItem(k));
  // also clear session token which is used to preserve session across refresh
  try { sessionStorage.removeItem('jwt'); } catch (e) { /* ignore */ }
  } catch (e) {
    // ignore storage access errors (e.g., in private mode)
  }
}

function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  // Prefer sessionStorage (survives refresh, cleared on tab close) and fall back to localStorage
  const jwt = sessionStorage.getItem('jwt') || localStorage.getItem("jwt");
  const { auth } = useSelector((store) => store);
  useEffect(() => {
    const tokenToUse = auth.jwt || jwt;
    dispatch(getUser(tokenToUse, { hydrating: true }));
    dispatch(findCart(tokenToUse));
  }, [auth.jwt, dispatch, jwt]);

  useEffect(() => {
    // Clear auth-related localStorage immediately when the page is unloaded or
    // when the page is hidden for 3 minutes. This helps force a fresh login when
    // the user returns after being away.

  // If the app was started and localStorage has an auth token but sessionStorage
  // does not, copy it into sessionStorage so a page refresh preserves the session
  // for this tab. SessionStorage is cleared on tab close, which satisfies the
  // requirement to drop session when tab is closed.
  try {
    const localJwt = localStorage.getItem('jwt');
    if (localJwt && !sessionStorage.getItem('jwt')) {
      sessionStorage.setItem('jwt', localJwt);
    }
  } catch (e) { /* ignore */ }

  let inactivityTimer = null;

    function onVisibilityChange() {
      if (document.hidden) {
        // schedule a safety timer to clear after 3 minutes if still hidden
        inactivityTimer = setTimeout(() => {
          if (document.hidden) clearAppLocalStorage();
        }, 3 * 60 * 1000);
      } else {
        // page became visible again — cancel any pending clear
        if (inactivityTimer) { clearTimeout(inactivityTimer); inactivityTimer = null; }
      }
    }

    // Only listen for visibility change. We intentionally do NOT clear on
    // beforeunload/pagehide because those fire on refresh as well, which would
    // force users to re-login on every refresh. SessionStorage preserves the
    // JWT across refresh; on tab close sessionStorage is cleared automatically.
    window.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('visibilitychange', onVisibilityChange);
      if (inactivityTimer) clearTimeout(inactivityTimer);
    };
  }, []);

  useEffect(()=>{
    // Only attempt to fetch the restaurant-for-user when we have user details
    // and the user is not a plain customer. Calling the admin endpoint with a
    // customer token will return 403 and pollute the console.
    const tokenToUse = auth.jwt || jwt;
    if (!tokenToUse) return;
    if (!auth.user) return; // wait for getUser to populate role
    // If your app uses a different role string for restaurant owners/admins,
    // change this check accordingly.
    if (auth.user.role === 'ROLE_CUSTOMER') return;
    dispatch(getRestaurantByUserId(tokenToUse));

  }, [auth.user, auth.jwt, dispatch, jwt]);

  // Determine if current path is under admin (restaurant side)
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    // Only add top padding for customer side where Navbar is present
    <div className={isAdminRoute ? '' : 'pt-16'}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />

  <Routers />
  <Toasts />
      </ThemeProvider>
    </div>
  );
}

export default App;
