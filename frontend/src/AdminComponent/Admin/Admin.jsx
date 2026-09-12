import React, { useEffect } from "react";
import AdminSideBar from "./AdminSideBar";
import { Route, Routes } from "react-router-dom";

import { Orders } from "../Orders/Orders";
import { Menu } from "../Menu/Menu";
import { FoodCategory } from "../FoodCategory/FoodCategory";
import { Events } from "../Events/Events";
import { Ingredients } from "../Ingredients/Ingredients";
import {RestaurantDetails} from "./RestaurantDetails";
import { RestaurantDashboard } from "../Dashboard/Dashboard";
import CreateMenuForm from "../Menu/CreateMenuForm";
import { useDispatch, useSelector } from "react-redux";
import { getRestaurantsCategory } from "../../component/State/Restaurant/Action";
import { fetchRestaurantsOrder } from "../../component/State/Restaurant Order/Action";

const Admin = () => {
   const { restaurant } = useSelector((store) => store);
    const dispatch = useDispatch();
    const jwt=localStorage.getItem("jwt");

  const handleClose = () => {};
  useEffect(() => {
    const id = restaurant?.usersRestaurants?.[0]?.id;
    if (id) {
      dispatch(getRestaurantsCategory({jwt,restaurantId:id}));
      dispatch(fetchRestaurantsOrder({ jwt, restaurantId:id }));
      // dispatch(getMenuItemsByRestaurantId({jwt,restaurantId:id}));
      // dispatch(getRestaurantByID({jwt,restaurantId:id}));
    }
  }, [dispatch, jwt, restaurant?.usersRestaurants]);
  return (
    <div>
      <div className="lg:flex justify-between">
        <div>
          <AdminSideBar handleClose={handleClose} />
        </div>
  <div className="lg:w-[80%] pt-16">
          <Routes>
            <Route path="/" element={<RestaurantDashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/category" element={<FoodCategory />} />
            <Route path="/ingredients" element={<Ingredients />} />
            <Route path="/event" element={<Events />} />
            <Route path="/details" element={<RestaurantDetails />} />
            <Route path="/add-menu" element={<CreateMenuForm onClose={() => window.history.back()} />} />
          </Routes>

        </div>
      </div>
    </div>
  );
};

export default Admin;
