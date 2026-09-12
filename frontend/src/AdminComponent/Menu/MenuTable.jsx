import {
  Avatar,
  Box,
  Card,
  CardHeader,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import React, { useEffect } from "react";
import CreateIcon from "@mui/icons-material/Create";
import { Delete } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { deleteFoodAction, getMenuItemsByRestaurantId, updateFoodCategory } from "../../component/State/Menu/Action";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { getRestaurantsCategory } from "../../component/State/Restaurant/Action";
import { getIngredientsOfRestaurant } from "../../component/State/Ingredients/Action";

export default function MenuTable() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const { restaurant, menu, ingredients } = useSelector((store) => store);
  const restaurantId = restaurant?.usersRestaurants?.[0]?.id;

  useEffect(() => {
    if (jwt && restaurantId) {
      dispatch(
        getMenuItemsByRestaurantId({
          jwt,
          restaurantId,
          vegetarian: false,
          nonveg: false,
          seasonal: false,
          food_category: "",
        })
      );
      dispatch(getRestaurantsCategory({ jwt, restaurantId }));
    }
  }, [dispatch, jwt, restaurantId]);

  // Fetch ingredients if not present so we can resolve names from IDs
  useEffect(() => {
    if (jwt && restaurantId && (!ingredients?.ingredients || ingredients.ingredients.length === 0)) {
      dispatch(getIngredientsOfRestaurant({ jwt, id: restaurantId }));
    }
  }, [dispatch, jwt, restaurantId, ingredients?.ingredients]);

  const handleDeleteFood = (foodId) => {
  dispatch(deleteFoodAction({ jwt, foodId}));
  };

  
  return (
    <Box>
      <Card className="mt-1">
        <CardHeader
          action={
            <IconButton
              onClick={() => navigate("/admin/restaurants/add-menu")}
              aria-label="settings"
            >
              <CreateIcon />
            </IconButton>
          }
          title={"Menu"}
          sx={{ pt: 2, alignItems: "center" }}
        />

        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell align="left">image</TableCell>
                <TableCell align="right">Title</TableCell>
                <TableCell align="right">Category</TableCell>
                <TableCell align="right">Ingredients</TableCell>
                <TableCell align="right">price</TableCell>
                <TableCell align="right">Availabilty</TableCell>
                <TableCell align="right">Delete</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {menu.loading && (
                <TableRow>
                  <TableCell colSpan={6} align="center">Loading...</TableCell>
                </TableRow>
              )}
              {!menu.loading && (!menu?.menuItems || menu.menuItems.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} align="center">No menu items yet.</TableCell>
                </TableRow>
              )}
              {Array.isArray(menu?.menuItems) && menu.menuItems.map((item) => {
                // Backend may return ingredients as objects, ingredientIds array, or both
                let ingArray = item.ingredients;
                if (!ingArray || ingArray.length === 0) {
                  ingArray = item.ingredientIds;
                }
                if (!Array.isArray(ingArray)) ingArray = [];
                const master = ingredients?.ingredients || [];
                const displayIngredients = ingArray.map((ing) => {
                  if (ing && typeof ing === "object") return ing;
                  const found = master.find((m) => String(m.id) === String(ing));
                  return found || { id: ing, name: ing };
                });
                return (
                  <TableRow
                    key={item.id}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      <Avatar src={item.images?.[0]}></Avatar>
                    </TableCell>
                    <TableCell align="right">{item.name}</TableCell>
                    <TableCell align="right">
                      <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel id={`cat-${item.id}`}>Category</InputLabel>
                        <Select
                          labelId={`cat-${item.id}`}
                          label="Category"
                          value={String(item.foodCategory?.id || item.category?.id || "")}
                          onChange={(e) => {
                            const newId = e.target.value;
                            if (newId === undefined || newId === null || newId === "") return;
                            dispatch(updateFoodCategory({ foodId: item.id, categoryId: Number(newId), jwt }));
                          }}
                        >
                          <MenuItem value=""><em>Unassigned</em></MenuItem>
                          {(restaurant.categories || []).map((c) => (
                            <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell align="right">
                      {displayIngredients.length === 0 ? (
                        <Chip label="No ingredients" size="small" color="default" />
                      ) : (
                        displayIngredients.map((ingredient) => (
                          <Chip key={ingredient.id || ingredient.name} label={ingredient.name} sx={{ mr: 0.5, mb: 0.5 }} />
                        ))
                      )}
                    </TableCell>
                    <TableCell align="right">₹{item.price}</TableCell>
                    <TableCell align="right">{item.available ? "I Stock" : "Out of stock"}</TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleDeleteFood(item.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
