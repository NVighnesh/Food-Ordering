import React from "react";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { Chip, IconButton } from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useDispatch, useSelector } from "react-redux";
import { API_URL } from "../config/api";
// ... no navigation used in this component
import { removeCartItem, updateCartItem } from "../State/Cart/Action";

export const CartItem = ({ item }) => {
  // select only what we need to avoid returning the whole store
  const auth = useSelector((state) => state.auth) || {};
  const dispatch=useDispatch();
  const jwt = (auth && auth.jwt) || localStorage.getItem("jwt");

  if (!item) return null; // defensive: nothing to render

    const handleUpdateCartItem=(value)=>{
      const currentQty = item.quantity || 0;
      const newQty = currentQty + value;
      // If decrementing to zero or below, remove the item instead of updating
      if (newQty <= 0) {
        handleRemoveCartItem();
        return;
      }

      const data = { cartItemId: item.id, quantity: newQty };
      dispatch(updateCartItem({ data, jwt }));

    }
    const handleRemoveCartItem = () => {
      dispatch(removeCartItem({cartItemId:item.id,jwt:auth.jwt||jwt}));
    }

    
  return (
    <div className="px-5">
      <div className="lg:flex items-center lg:space-x-5">
          <div>
            <img
              className="w-[5rem] h-[5rem] object-cover"
              src={(() => {
                // Try multiple places for an image: nested under food, top-level images array, single image fields.
                const candidateImages = (
                  item?.food?.images || item?.images || (item?.image && [item.image]) || item?.foodImages || []
                );
                const img = (Array.isArray(candidateImages) && candidateImages.length > 0)
                  ? candidateImages[0]
                  : (typeof item?.image === 'string' && item.image) ||
                    (typeof item?.foodImage === 'string' && item.foodImage) ||
                    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='100%' height='100%' fill='%23333'/><text x='50%' y='50%' fill='%23fff' font-size='10' font-family='Arial' text-anchor='middle' dominant-baseline='central'>No+Image</text></svg>";

                // if img already absolute or data URI, return as-is
                try {
                  if (typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:'))) {
                    return img;
                  }
                } catch (e) {}

                // prefix with API_URL when the backend returns relative paths like '/uploads/..' or 'uploads/...'
                if (typeof img === 'string') {
                  if (img.startsWith('/')) return `${API_URL}${img}`;
                  return `${API_URL}/${img}`;
                }
                return img;
              })()}
              alt={item?.food?.name || item?.name || item?.foodName || ""}
            />
          </div>
        <div className="flex items-center justify-between lg:w-[70%]">
          <div className="space-y-1 lg:space-y-3 w-full">
            <p>{item?.food?.name || item?.name || item?.foodName || "Item"}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <IconButton onClick={() => handleUpdateCartItem(-1)}>
                  <RemoveCircleOutlineIcon />
                </IconButton>
                <div className="w-5 h-5 text-xs flex items-center justify-center">
                  {item.quantity}
                </div>
                <IconButton onClick={() => handleUpdateCartItem(1)}>
                  <AddCircleOutlineIcon />
                </IconButton>
              </div>
            </div>
          </div>
          <p>₹{Number(item?.totalPrice ?? item?.food?.price ?? 0)}</p>
        </div>
      </div>
      <div className="pt-3 space-x-2">
        {(item.ingredients || []).map((ingredient, idx) => (
          <Chip key={idx} label={ingredient} />
        ))}

      </div>
    </div>
  );
};
