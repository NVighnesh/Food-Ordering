import { Button, TextField } from "@mui/material";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createIngredientCategory } from "../../component/State/Ingredients/Action";

const CreateIngredientCategoryForm = ({ onClose }) => {
    const dispatch = useDispatch();
    const jwt = localStorage.getItem("jwt");
  const [formData, setFormData] = useState({ name: ""});
  const {restaurant, ingredients } = useSelector((store) => store);
  const handleSubmit = async (e) => {
    e.preventDefault();
  const restaurantId = restaurant?.usersRestaurants?.[0]?.id;
  if (!restaurantId) return; // guard if not yet loaded
  const data={name:formData.name,restaurantId}
    try {
      await dispatch(createIngredientCategory({data,jwt}));
      // effect below will close upon state update
    } catch (e) {
      // leave form open for correction
    }
    console.log(formData);
  };
  useEffect(() => {
    const last = ingredients.category[ingredients.category.length - 1];
    if (last && last.name === formData.name) {
      if (typeof onClose === 'function') onClose();
      setFormData({ name: '' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingredients.category.length]);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,[name]:value
    })
  }
  return (
    <div className="">
      <div className="p-5">
        <h1 className="text-gray-400 text-center text-xl pb-10">
          Create Ingredient Category
        </h1>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            id="name"
            name="name"
            label="category"
            variant="outlined"
            onChange={handleInputChange}
            value={formData.name}
          ></TextField>
          <Button type="submit" variant="contained"> Create Category</Button>
        </form>
      </div>
    </div>
  );
};

export default CreateIngredientCategoryForm;
