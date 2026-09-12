import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
} from "@mui/material";
import { useFormik } from "formik";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CloseIcon from "@mui/icons-material/Close";
import { uploadImageToCloudinary } from "../util/UploadToCloudinary";
import { useDispatch, useSelector } from "react-redux";
import { createMenuItem } from "../../component/State/Menu/Action";
import { getRestaurantsCategory } from "../../component/State/Restaurant/Action";
import { getIngredientsOfRestaurant } from "../../component/State/Ingredients/Action";

const initialValues = {
  name: "",
  description: "",
  price: "",
  categoryId: "", // store category id not object
  restaurantId: "",
  vegetarian: true,
  seasonal: false,
  ingredientIds: [], // store ingredient ids
  images: [],
};

const CreateMenuForm = ({ onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const jwt = localStorage.getItem("jwt");
  const { restaurant, ingredients, menu } = useSelector((store) => store);
  const [uploadImage, setUploadImage] = useState(false);
  const formik = useFormik({
    initialValues,
    onSubmit: (values) => {
      const restId = restaurant?.usersRestaurants?.[0]?.id;
      if (!restId) return;
      // Require a category selection to ensure relation is persisted
      if (!values.categoryId) {
        console.warn("No category selected for menu item; select a category to enable filtering.");
        // Optionally you can show a toast here if you have a toast utility
        // dispatch(addLocalNotification({ type: 'toast', title: 'Select a category', body: 'Please choose a category for the menu item', data: { level: 'warn' } }))
        return;
      }
      const payload = {
        name: values.name,
        description: values.description,
        price: Number(values.price) || 0,
        vegetarian: values.vegetarian,
        seasonal: values.seasonal,
        restaurantId: restId,
  categoryId: values.categoryId ? Number(values.categoryId) : undefined, // preferred by backend
  foodCategoryId: values.categoryId ? Number(values.categoryId) : undefined, // still provided for action normalizer
    // Send nested category objects for backend that expects 'category' field
  category: values.categoryId ? { id: Number(values.categoryId) } : undefined,
  foodCategory: values.categoryId ? { id: Number(values.categoryId) } : undefined,
    ingredientIds: values.ingredientIds,
    // also send ingredients as objects so backend can bind relation
    ingredients: values.ingredientIds.map((id) => ({ id })),
    images: values.images,
    // include full restaurant ref as some backends need nested object
    restaurant: { id: restId },
      };
      console.log("Form submitted with data:", payload);
  dispatch(createMenuItem({ menu: payload, jwt }));
    },
  });
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    setUploadImage(true);
    const image = await uploadImageToCloudinary(file);
    formik.setFieldValue("images", [...formik.values.images, image]);
    setUploadImage(false);
  };
  const handleRemoveImage = (index) => {
    const updatedImages = [...formik.values.images];
    updatedImages.splice(index, 1);
    formik.setFieldValue("images", updatedImages);
  };
    const restaurantId = restaurant?.usersRestaurants?.[0]?.id;

  useEffect(() => {
    if (restaurantId && jwt) {
      dispatch(getIngredientsOfRestaurant({ jwt, id: restaurantId }));
      // also fetch categories so the selector has options
      dispatch(getRestaurantsCategory({ jwt, restaurantId }));
    }
  }, [restaurantId, jwt, dispatch]);

  // Auto close & return to previous page when creation succeeds
  useEffect(() => {
    if (menu?.message === "Menu item created successfully") {
      const justCreatedName = formik.values.name; // capture before reset
      formik.resetForm();
      if (typeof onClose === 'function') {
        onClose();
      } else {
        navigate(-1);
      }
      if (process.env.NODE_ENV !== 'production') console.debug('Closed menu form after create:', justCreatedName);
    }
  }, [menu?.message, formik, onClose, navigate]);

  return (
    <div className="py-10 px-5 lg:flex items-center justify-center min-h-screen">
      <div className="lg:max-w-4xl">
        <h1 className="font-bold text-2xl text-center py-2">
          Add New Menu
        </h1>
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <Grid container spacing={2}>
            <Grid className="flex flex-wrap gap-5" xs={12}>
              <input
                accept="image/*"
                id="fileInput"
                style={{ display: "none" }}
                onChange={handleImageChange}
                type="file"
              />
              <label className="relative" htmlFor="fileInput">
                <span className="w-24 h-24 cursor-pointer flex items-center justify-center p-3 border rounded-md border-gray-600">
                  <AddPhotoAlternateIcon className="text-white" />
                </span>
                {uploadImage && (
                  <div className="absolute left-0  top-0 right-0 bottom-0 h-24 w-24 flex items-center justify-center">
                    <CircularProgress />
                  </div>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                {formik.values.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      className="w-24 h-24 object-cover"
                      key={index}
                      src={image}
                      alt=""
                    />
                    <IconButton
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        outline: "none",
                      }}
                      onClick={() => handleRemoveImage(index)}
                    >
                      <CloseIcon sx={{ fontSize: "1rem", color: "grey" }} />
                    </IconButton>
                  </div>
                ))}
              </div>
            </Grid>

            {/* Name - Full Width */}
            <Grid item xs={12}>
              <TextField
                sx={{ m: 1, width: 400 }}
                fullWidth
                id="name"
                name="name"
                label="Name"
                variant="outlined"
                onChange={formik.handleChange}
                value={formik.values.name}
              />
            </Grid>

            {/* Description - Full Width */}
            <Grid item xs={12}>
              <TextField
                sx={{ m: 1, width: 400 }}
                fullWidth
                id="description"
                name="description"
                label="Description"
                variant="outlined"
                onChange={formik.handleChange}
                value={formik.values.description}
              />
            </Grid>

            {/* Cuisine Type and Opening Hours - Side by Side */}
            <Grid item xs={12} lg={6}>
              <TextField
                sx={{ m: 1, width: 400 }}
                fullWidth
                id="price"
                name="price"
                label="Price"
                variant="outlined"
                onChange={formik.handleChange}
                value={formik.values.price}
              />
            </Grid>
            <Grid item xs={12} lg={6}>
              <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                <InputLabel id="demo-select-small-label">Category</InputLabel>
                <Select
                  labelId="demo-select-small-label"
                  id="demo-select-small"
                  value={formik.values.categoryId}
                  label="Category"
                  onChange={formik.handleChange}
                  name="categoryId"
                >
                  {restaurant.categories?.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl sx={{ m: 1, width: 900 }}>
                <InputLabel id="demo-multiple-chip-label">
                  Ingredients
                </InputLabel>
                <Select
                  labelId="demo-multiple-chip-label"
                  id="demo-multiple-chip"
                  name="ingredientIds"
                  multiple
                  value={formik.values.ingredientIds}
                  onChange={formik.handleChange}
                  input={<OutlinedInput id="select-multiple-chip" label="Ingredients" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((id) => {
                        const found = ingredients.ingredients?.find((ing) => ing.id === id);
                        return <Chip key={id} label={found?.name || id} />;
                      })}
                    </Box>
                  )}
                >
                  {ingredients.ingredients?.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} lg={6}>
              <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                <InputLabel id="demo-select-small-label">Is Seasonal</InputLabel>
                <Select
                  labelId="demo-select-small-label"
                  id="seasonal"
                  value={formik.values.seasonal}
                  label="Is Seasonal"
                  onChange={formik.handleChange}
                  name="seasonal"
                >
                  <MenuItem value={true}>Yes</MenuItem>
                  <MenuItem value={false}>No</MenuItem>

                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} lg={6}>
              <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                <InputLabel id="demo-select-small-label">Is Vegetarian</InputLabel>
                <Select
                  labelId="demo-select-small-label"
                  id="vegetarian"
                  value={formik.values.vegetarian}
                  label="Is Vegetarian"
                  onChange={formik.handleChange}
                  name="vegetarian"
                >
                  <MenuItem value={true}>Yes</MenuItem>
                  <MenuItem value={false}>No</MenuItem>

                </Select>
              </FormControl>
            </Grid>

            
          </Grid>
          <Button variant="contained" color="primary" type="submit" disabled={uploadImage}>
            Create Menu
          </Button>
        </form>
      </div>
    </div>
  );
}

export default CreateMenuForm;
