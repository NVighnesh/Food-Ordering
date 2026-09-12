import React from "react";
import { ProfileNavigation } from "./ProfileNavigation";
import { Route, Routes } from "react-router-dom";
import UserProfile from "./UserProfile";
import Address from "./Address";
import {Favorites} from "./Favorites";
import Events from "./Events";
import Orders from "./Orders";
import Payment from "./Payment";
import Notifications from "./Notifications";

const Profile = () => {
  const [openSideBar] = React.useState(false);
  return (
    <div className="lg:flex">
      <div className="lg:w-[240px]">
        <ProfileNavigation open={openSideBar} />
      </div>
      <div className="flex-1 pt-16">
        <Routes>
          <Route path="/" element={<UserProfile />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/address" element={<Address />} />
          <Route path="/favourites" element={<Favorites />} />

          <Route path="/events" element={<Events />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </div>
    </div>
  );
};

export default Profile;
