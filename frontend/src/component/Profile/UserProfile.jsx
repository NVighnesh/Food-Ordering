import React from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { Button } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../State/Authentication/Action";
import { useNavigate } from "react-router-dom";

const UserProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth) || {};

  const handleLogout = async () => {
    try {
      await dispatch(logout());
  navigate("/account/login");
    } catch (e) {
      // ignore
    }
  };

  const fullName = auth?.user?.fullName || auth?.user?.name || "";
  const email = auth?.user?.email || "";

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center text-center">
      <div className="flex flex-col items-center justify-center">
        <AccountCircleIcon sx={{ fontSize: "9rem" }} />
        <h1 className="py-5 text-2xl font-semibold">{fullName || "User"}</h1>
        <p>{email}</p>
        <Button onClick={handleLogout} variant="contained" sx={{ margin: "2rem 0rem" }}>
          Logout
        </Button>
      </div>
    </div>
  );
};

export default UserProfile;
