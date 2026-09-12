import { Card, IconButton, Chip } from "@mui/material";
import React from "react";
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToFavorite } from "../State/Authentication/Action";
import { isPresentInFavorites } from "../config/logic";

const RestaurantCard = ({item}) => {
  const navigate=useNavigate();
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  // select only auth slice to avoid returning the whole store
  const auth = useSelector((state) => state.auth) || {};

  const handleAddToFavorite = () => {
    if (!item.id) {
      console.error("Restaurant ID is missing:", item);
      return;
    }
  console.log("Toggling favorite - Restaurant ID:", item.id);
    dispatch(addToFavorite({restaurantId: item.id, jwt}));
  }
    const handleNavigateToRestaurant = () => {
      const city = item?.address?.city || "unknown";
      const name = item?.name || "unknown";
      const id = item?.id || item?._id || "unknown";
      navigate(`/restaurant/${city}/${name}/${id}`);
    };
  return (
    <div>
      <Card className="w-[18rem]">
        <div
          className="cursor-pointer relative"
          onClick={handleNavigateToRestaurant}
        >
          <img
            className="w-full h-[10rem] rounded-t-md object-cover"
            src={item.images && item.images.length > 0 ? item.images[0] : "/placeholder-restaurant.jpg"}
            alt={item.name || "Restaurant"}
          />
          <Chip
            size="small"
            className="absolute top-2 left-2"
            color={item.open ? "success" : "error"}
            label={item.open ? "Open Now" : "Closed"}
          />
        </div>
        <div className="p-4 textPart lg:flex w-full justify-between">
            <div className="space-y-1">
                <p onClick={handleNavigateToRestaurant} className="font-semibold text-lg cursor-pointer">{item.name}</p>
                <p className=" text-gray-500 text-sm">
                    {item.description}
                </p>
            </div>
            <div>
                <IconButton onClick={handleAddToFavorite}>
                    {isPresentInFavorites(Array.isArray(auth.favorites) ? auth.favorites : [], item) ? <FavoriteIcon/> : <FavoriteBorderIcon/>}
                </IconButton>
            </div>

        </div>
      </Card>
    </div>
  );
};

export default RestaurantCard;
