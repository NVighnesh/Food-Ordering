import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createIngredient } from "../../component/State/Ingredients/Action";

const CreateIngredientForm = ({ onClose }) => {
  const dispatch = useDispatch(); 
  const jwt = localStorage.getItem("jwt");
  const { restaurant, ingredients } = useSelector((store) => store);

  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
  });
  const handleSubmit = async (e) => {
    e.preventDefault();
    const restId = restaurant?.usersRestaurants?.[0]?.id;
    const catId = formData.categoryId ? Number(formData.categoryId) : null;
    if (!restId || !catId) {
      console.warn("Missing restaurantId or categoryId", { restId, catId });
      return;
    }
    // Include multiple shapes to satisfy unknown backend DTO field names
    // Backend trace shows null id when loading category; most likely expects `ingredientCategoryId` OR `categoryId` only.
    // We'll send a concise payload with both simple keys (no nested objects) so controller binder picks one.
    const data = {
      name: formData.name,
      ingredientCategoryId: catId,
      categoryId: catId,
      restaurantId: restId,
    };
    console.log("Create ingredient payload", data);
    try {
      await dispatch(createIngredient({ data, jwt }));
      // Rely on effect to close once state updates (ensures success)
    } catch (e) {
      // keep form open so user can fix errors
    }
  };
  // Auto-close when a new ingredient appears (length increases)
  useEffect(() => {
    // basic heuristic: close if last added ingredient matches current form name
    const last = ingredients.ingredients[ingredients.ingredients.length - 1];
    if (last && last.name === formData.name) {
      if (typeof onClose === 'function') onClose();
      setFormData({ name: '', categoryId: '' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingredients.ingredients.length]);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  return (
    <div className="">
      <div className="p-5">
        <h1 className="text-gray-400 text-center text-xl pb-10">
          Create Ingredient
        </h1>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            id="name"
            name="name"
            label="Name"
            variant="outlined"
            onChange={handleInputChange}
            value={formData.name}
          ></TextField>
          <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
            <InputLabel id="demo-select-small-label">Category</InputLabel>
            <Select
              labelId="demo-select-small-label"
              id="demo-select-small"
              value={formData.categoryId}
              label="Category"
              onChange={handleInputChange}
              name="categoryId"
            >
              {ingredients.category.map((item) => (
                <MenuItem  value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button type="submit" variant="contained">
            {" "}
            Create Ingredient
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateIngredientForm;
