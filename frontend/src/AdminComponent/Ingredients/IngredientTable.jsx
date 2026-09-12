import {
  Box,
  Button,
  Card,
  CardHeader,
  IconButton,
  Modal,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React, { useEffect } from "react";
import CreateIcon from "@mui/icons-material/Create";
import CreateIngredientForm from "./CreateIngredientForm";
import { useDispatch, useSelector } from "react-redux";
import { getIngredientsOfRestaurant, updateStockOfIngredient } from "../../component/State/Ingredients/Action";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

export default function IngredientTable() {
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const { restaurant, ingredients } = useSelector((store) => store);

  const restaurantId = restaurant?.usersRestaurants?.[0]?.id;

  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    if (restaurantId && jwt) {
      dispatch(
        getIngredientsOfRestaurant({ jwt, id: restaurantId })
      );
    }
  }, [restaurantId, jwt, dispatch]);

  const isLoadingRestaurant = !restaurantId;
  const list = ingredients.ingredients || [];

  const handleUpdateStock = (id) => {
    dispatch(updateStockOfIngredient({ id, jwt }));
  };

  return (
    <Box>
      <Card className="mt-1">
        <CardHeader
          action={
            <IconButton onClick={handleOpen} aria-label="add-ingredient">
              <CreateIcon />
            </IconButton>
          }
          title={"Ingredients"}
          sx={{ pt: 2, alignItems: "center" }}
        />

        {isLoadingRestaurant ? (
          <Box p={2}>
            <Typography variant="body2" color="text.secondary">
              Loading restaurant...
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="ingredients table">
              <TableHead>
                <TableRow>
                  <TableCell align="left">Id</TableCell>
                  <TableCell align="right">Name</TableCell>
                  <TableCell align="right">Category</TableCell>
                  <TableCell align="right">Availability</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No ingredients yet.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {list.map((item) => (
                  <TableRow
                    key={item.id}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {item.id}
                    </TableCell>
                    <TableCell align="right">{item.name}</TableCell>
                    <TableCell align="right">{item.category?.name}</TableCell>
                    <TableCell align="right">
                      <Button onClick={() => handleUpdateStock(item.id)} size="small" variant="outlined">
                        {item.inStock ? "In Stock" : "Out Of Stock"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="create-ingredient-modal-title"
        aria-describedby="create-ingredient-modal-description"
      >
        <Box sx={style}>
          <CreateIngredientForm onClose={handleClose} />
        </Box>
      </Modal>
    </Box>
  );
}
