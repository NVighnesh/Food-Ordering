import React from 'react'
import { Navbar } from '../component/Navbar/Navbar'
import { Route, Routes } from 'react-router-dom'
import { Home } from '../component/Home/Home'
import RestaurantDetails from '../component/Restaurant/RestaurantDetails'
import { Cart } from '../component/Cart/Cart'
import Profile from '../component/Profile/Profile'
import { Auth } from '../component/Auth/Auth'
import { PaymentSuccess } from '../component/PaymentSuccess/PaymentSuccess'
import RequireCustomer from '../component/Auth/RequireCustomer'
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const CustomerRoute = () => {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    const userRaw = localStorage.getItem('user_profile');
    let user = null;
    try { if (userRaw) user = JSON.parse(userRaw); } catch (e) { user = null; }

    // If an owner is logged in, redirect to admin dashboard and prevent access to customer routes
    if (user && user.role === 'ROLE_RESTAURANT_OWNER') {
      navigate('/admin/restaurants');
      return;
    }

    if (!jwt) {
      // If user is already on auth pages, let them continue (login/register)
      const pathname = location.pathname || '';
      if (!pathname.startsWith('/account/login') && !pathname.startsWith('/account/register')) {
        navigate('/account/login');
      }
    }
    // run once on mount
  }, [navigate, location.pathname]);
  return (
    <div>
        <Navbar/>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/account/:register" element={<Home />} />
            <Route path="/restaurant/:city/:title/:id" element={<RestaurantDetails />} />
            <Route path="/cart" element={<RequireCustomer><Cart/></RequireCustomer>} />
            <Route path="/my-profile/*" element={<RequireCustomer><Profile/></RequireCustomer>} />
            <Route path="/payment/success/:id" element={<PaymentSuccess />} />
        </Routes>
        <Auth/>
    </div>
  )
}

export default CustomerRoute