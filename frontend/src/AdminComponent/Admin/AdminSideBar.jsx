import { Dashboard, ShoppingBag } from "@mui/icons-material";
import React from "react";
import ShopTwoIcon from "@mui/icons-material/ShopTwo";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import EventIcon from "@mui/icons-material/Event";
import FastfoodIcon from "@mui/icons-material/Fastfood";
import CategoryIcon from "@mui/icons-material/Category";
import { Divider, Drawer, useMediaQuery } from "@mui/material";
import { useLocation } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../component/State/Authentication/Action";

const menu = [
  { title: "Dashboard", icon: <Dashboard />, path: "/" },
  { title: "Orders", icon: <ShoppingBag />, path: "/orders" },
  { title: "Menu", icon: <ShopTwoIcon />, path: "/menu" },
  { title: "Food Category", icon: <CategoryIcon />, path: "/category" },
  { title: "Ingredients", icon: <FastfoodIcon />, path: "/ingredients" },
  { title: "Events", icon: <EventIcon />, path: "/event" },
  { title: "Details", icon: <AdminPanelSettingsIcon />, path: "/details" },
  { title: "Logout", icon: <LogoutIcon />, path: "/" },
];

const AdminSideBar = ({handleClose}) => {
  const isSmallScreen = useMediaQuery("(max-width:1080px)");
  const location = useLocation();
  // keep a top offset only for the customer profile pages so the profile sidebar sits below the navbar
  // admin and restaurant pages will start the sidebar at top:0 (no gap)
  const isProfileRoute = location.pathname && location.pathname.startsWith('/my-profile');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const handleNavigate = (item) => {
    navigate(`/admin/restaurants${item.path}`);
    if (item.title === "Logout") {
  // open login modal after logout
  dispatch(logout())
  navigate("/account/login");
  handleClose()
    }
  };
  return (
    <div>
      <>
        <Drawer
          variant={isSmallScreen ? "temporary" : "permanent"}
          onClose={handleClose}
          open={true}
          anchor="left"
          sx={{
            zIndex: 1,
            '& .MuiDrawer-paper': {
              width: isSmallScreen ? '70vw' : '240px',
              // only profile pages need the 64px top offset to sit below the global navbar
              top: isProfileRoute ? '64px' : '0px',
              height: isProfileRoute ? 'calc(100vh - 64px)' : '100vh',
              boxSizing: 'border-box',
              position: 'fixed',
              overflow: 'auto',
              backgroundColor: '#0b0b0b',
            }
          }}
        >
          <div className="w-[70vw] lg:w-[20vw] h-full flex flex-col justify-start text-lg">
            {menu.map((item, i) => (
              <div key={`admin-menu-${i}`}>
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
      </>
    </div>
  );
};

export default AdminSideBar;
