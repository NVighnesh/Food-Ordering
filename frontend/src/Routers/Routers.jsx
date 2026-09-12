import React from "react";
import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import { AdminRoute } from "./AdminRoute";
import CustomerRoute from "./CustomerRoute";
import { useSelector } from 'react-redux';

// Global guard wrapper component
const GlobalRouteGuard = ({ children }) => {
  const location = useLocation();
  const path = location.pathname || "/";
  // Prefer live Redux auth state for role checks to avoid stale localStorage causing
  // incorrect redirects (for example after order flows that may update localStorage).
  const auth = useSelector((state) => state.auth) || {};
  let user = auth.user || null;

  // If no user in Redux, fall back to persisted user_profile for session restore
  if (!user) {
    try { const raw = localStorage.getItem('user_profile'); if (raw) user = JSON.parse(raw); } catch (e) { user = null; }
  }

  // If an owner is logged in, and they are not on an admin path, force redirect to admin root
  if (user && (user.role === 'ROLE_RESTAURANT_OWNER' || user.role === 'OWNER' || user.role === 'ROLE_OWNER')) {
    if (!path.startsWith('/admin/restaurants')) {
      return <Navigate to="/admin/restaurants" replace />;
    }
  }

  // If not an owner but trying to access admin path, send them to public home
  if (!user || !(user.role === 'ROLE_RESTAURANT_OWNER' || user.role === 'OWNER' || user.role === 'ROLE_OWNER')) {
    if (path.startsWith('/admin/restaurants')) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

const Routers = () => {
  return (
    <GlobalRouteGuard>
      <Routes>
        <Route path="/admin/restaurants/*" element={<AdminRoute />}></Route>
        <Route path="/*" element={<CustomerRoute />}></Route>
      </Routes>
    </GlobalRouteGuard>
  );
};

export default Routers;
