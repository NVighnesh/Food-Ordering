import { Button, TextField } from "@mui/material";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createCategoryAction } from "../../component/State/Restaurant/Action";

const CreateFoodCategoryForm = ({ onClose }) => {
  const { restaurant } = useSelector((store) => store);
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const restaurantId = restaurant?.usersRestaurants?.[0]?.id;
  const [formData, setFormData] = useState({ categoryName: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!restaurantId) return;
    const data = {
      name: formData.categoryName,
      restaurantId,
    };
    try {
      await dispatch(createCategoryAction({ reqData: data, jwt }));
      // rely on effect to confirm state change before closing
    } catch (e) {
      // keep form open on error
    }
  };
  // Auto-close heuristic: watch categories array length via restaurant slice
  useEffect(() => {
    const categories = restaurant.categories || [];
    const last = categories[categories.length - 1];
    if (last && last.name === formData.categoryName) {
      if (typeof onClose === 'function') onClose();
      setFormData({ categoryName: '' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant.categories?.length]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  return (
    <div className="">
      <div className="p-5">
        <h1 className="text-gray-400 text-center text-xl pb-10">
          Create Food Category
        </h1>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            id="categoryName"
            name="categoryName"
            label="Food Category"
            variant="outlined"
            onChange={handleInputChange}
            value={formData.categoryName}
          ></TextField>
          <Button type="submit" variant="contained"> Create Category</Button>
        </form>
      </div>
    </div>
  );
};

export default CreateFoodCategoryForm;
