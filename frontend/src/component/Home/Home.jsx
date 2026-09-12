import React, { useEffect } from "react";
import "./Home.css";
import MultiItemCarousel from "./MultiItemCarousel";
import RestaurantCard from "../Restaurant/RestaurantCard";
import { useDispatch, useSelector } from "react-redux";
import { getAllRestaurantsAction } from "../State/Restaurant/Action";
import { useNavigate } from "react-router-dom";
import { findCart } from "../State/Cart/Action";

const restaurants = [1, 1, 1, 1, 1];
export const Home = () => {
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const restaurant = useSelector((state) => state.restaurant) || { restaurants: [] };
  const navigate = useNavigate();
  console.log(restaurant);
  useEffect(() => {
    // If jwt is null or undefined, still attempt to fetch (backend may allow public listing)
    // but include jwt in dependency so when a token is set after login the list will refresh.
    dispatch(getAllRestaurantsAction(jwt));

  }, [dispatch, jwt]);


  return (
    <div className="pb-10">
      <section className="banner -z-50 relative flex flex-col justify-center items-center">
        <div className="w-[50vw] z-10 text-center">
          <p className="text-2xl lg:text-6xl font-bold z-10 py-5">Feasto App</p>
          <p className="z-10 text-gray-300 text-xl lg:text-4xl">
            From local street food to your favourite restaurant. Discover and
            order with just a single tap.
          </p>
        </div>
        <div className="cover absolute top-0 left-0 right-0"></div>
        <div className="fadout"></div>
      </section>
      <section className="p-10 lg:py-10 lg:px-20">
        <p className="text-2xl font-semibold text-gray-400 py-3 pb-10">
          Top Meals
        </p>
        <MultiItemCarousel />
      </section>
      <section className="px-5 lg:px-20 pt-10">
        <h1 className="text-2xl font-semibold text-gray-400 pb-8">
          Order From Our HandPicked Favourites
        </h1>
        <div className="flex flex-wrap items-center justify-around gap-5">
          {(Array.isArray(restaurant?.restaurants) ? restaurant.restaurants : []).map((item, index) => {
            // defensive logging for debugging
            console.log(`Restaurant ${index}:`, item);
            return <RestaurantCard key={item?.id || item?._id || index} item={item} />;
          })}
        </div>
      </section>
    </div>
  );
};
