import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// Simple guard component to protect customer-only routes.
// If a JWT is present in localStorage we render children, otherwise redirect
// to the login modal route and pass the attempted location as state so that
// the login form can redirect back after successful authentication.
const RequireCustomer = ({ children }) => {
  const location = useLocation();
  const jwt = localStorage.getItem('jwt');
  if (!jwt) {
    return <Navigate to="/account/login" state={{ from: location }} replace />;
  }
  return children;
};

export default RequireCustomer;
