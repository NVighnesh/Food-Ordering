import React from "react";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
// ...existing imports...
import FavoriteIcon from "@mui/icons-material/Favorite";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import NotificationsIcon from "@mui/icons-material/Notifications";
import EventIcon from "@mui/icons-material/Event";
import LogoutIcon from "@mui/icons-material/Logout";
import { AddReaction } from "@mui/icons-material";
import { Divider, Drawer, useMediaQuery } from "@mui/material";
import { useLocation } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../State/Authentication/Action";

const menu = [
  { title: "orders", icon: <ShoppingBagIcon /> },
  { title: "Favourites", icon: <FavoriteIcon /> },
  { title: "Address", icon: <AddReaction /> },
  { title: "Payment", icon: <AccountBalanceWalletIcon /> },
  { title: "Notifications", icon: <NotificationsIcon /> },
  { title: "Events", icon: <EventIcon /> },
  { title: "Logout", icon: <LogoutIcon /> },
];

export const ProfileNavigation = ({ open, handleClose }) => {
  const isSmallScreen = useMediaQuery("(max-width:800px)");
  const location = useLocation();
  // only the "my-profile" routes should have the top offset to sit below the navbar
  const isProfileRoute = location.pathname && location.pathname.startsWith('/my-profile');

  const navigate=useNavigate();
  const dispatch=useDispatch();

  const handleNavigate=(item)=>{
    if(item.title === "Logout"){
  dispatch(logout())
  // open the login modal after logout
  navigate("/account/login");
    }
    else{

    navigate(`/my-profile/${item.title.toLowerCase()}`);
    }

  }

  return (
    <div>
  <Drawer
        variant={isSmallScreen ? "temporary" : "permanent"}
        onClose={handleClose}
        // permanent and visible on large screens (matches admin sidebar)
        open={isSmallScreen ? open : true}
        anchor="left"
        sx={{
        '& .MuiDrawer-paper': {
        width: isSmallScreen ? '70vw' : '240px',
        // place the drawer below the fixed navbar (navbar height ~64px) only on profile pages
        top: isProfileRoute ? '64px' : '0px',
        height: isProfileRoute ? 'calc(100vh - 64px)' : '100vh',
    boxSizing: 'border-box',
    position: 'fixed',
    overflow: 'auto',
    backgroundColor: '#0b0b0b',
          },
          zIndex: 1,
        }}
      >
    <div className="w-[70vw] lg:w-[20vw] h-full flex flex-col justify-start text-lg">
          {menu.map((item, i) => (
            <div key={`menu-${i}`}> 
              <div
                onClick={() => handleNavigate(item)}
                className="px-6 py-5 flex items-center gap-3 cursor-pointer hover:bg-white/5"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-white/90">
                  {React.cloneElement(item.icon, { fontSize: 'large' })}
                </div>
                <span className="text-white font-medium text-base">{item.title}</span>
              </div>
              {i !== menu.length - 1 && (
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', ml: 6, mr: 2 }} />
              )}
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
};
