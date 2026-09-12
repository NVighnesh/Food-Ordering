import React from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import CreateRestaurantForm from "../AdminComponent/CreateRestaurantForm/CreateRestaurantForm";
import Admin from "../AdminComponent/Admin/Admin";
import { useSelector } from "react-redux";

export const AdminRoute = () => {
  const restaurant = useSelector((state) => state.restaurant) || {};
  const auth = useSelector((state) => state.auth) || {};
  const location = useLocation();

  // If no jwt available, send user to login modal (preserve attempted location)
  const jwt = auth && auth.jwt ? auth.jwt : localStorage.getItem('jwt');
  if (!jwt) {
    return <Navigate to="/account/login" state={{ from: location }} replace />;
  }

  // If user is present but not a restaurant owner, redirect to public home
  const role = auth.user && auth.user.role ? auth.user.role : null;
  if (role && role !== 'ROLE_RESTAURANT_OWNER') {
    return <Navigate to="/" replace />;
  }

  return (
    <div>
      <Routes>
        <Route
          path="/*"
          element={
            // Show create form if the user has no restaurants yet
            !restaurant.usersRestaurants || restaurant.usersRestaurants.length === 0 ? (
              <CreateRestaurantForm />
            ) : (
              <Admin />
            )
          }
        ></Route>
      </Routes>
    </div>
  );
};
