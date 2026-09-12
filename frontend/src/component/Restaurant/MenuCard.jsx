import React from "react";
import Accordion from "@mui/material/Accordion";

import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { Button } from "@mui/material";
import { categorizeIngredients } from "../utils/categrizeIngredients";
import { useDispatch, useSelector } from "react-redux";
import { addItemToCart } from "../State/Cart/Action";


const MenuCard = ({ item }) => {
  const [selectedIngredients, setSelectedIngredients] = React.useState([]);
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth) || {};
  const handleCheckboxChange = (itemName) => {
    console.log("value");
    if (selectedIngredients.includes(itemName)) {
      setSelectedIngredients(
        selectedIngredients.filter((item) => item !== itemName)
      );
    } else {
      setSelectedIngredients([...selectedIngredients, itemName]);
    }
  };
  const handleAddItemToCart = (e) => {
    e.preventDefault();
  const token = (auth && auth.jwt) || localStorage.getItem("jwt");
    const reqData = {
      token,
      cartItem: {
        foodId: item.id,

        quantity: 1,
  ingredients: selectedIngredients,
  price: item.price || item.foodPrice || 0,
      },
    };
    dispatch(addItemToCart(reqData));
    console.log("Adding item to cart with data:", reqData);
  };

  return (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel1-content"
        id="panel1-header"
      >
        <div className="lg:flex items-center justify-between">
          <div className="lg:flex items-center lg:gap-5">
            <img
              className="w-[7rem] h-[7rem] object-cover"
              src={item.images[0]}
              alt=""
            />
            <div className="space-y-1 lg:space-y-5 lg:max-w-2xl">
              <p className="text-xl font-semibold">{item.name}</p>
              <p className="text-sm text-gray-400">
                {(item.foodCategory && item.foodCategory.name) ||
                  item.category ||
                  item.food_category ||
                  ""}
              </p>
              <p>₹{item.price}</p>
              <p className="text-gray-400">{item.description}</p>
            </div>
          </div>
        </div>
      </AccordionSummary>
      <AccordionDetails >
        <form>
          <div className="flex gap-5 flex-wrap">
            {Object.keys(categorizeIngredients(item.ingredients)).map(
              (category) => (
                <div key={category}>
                  <p>{category}</p>
                  <FormGroup>
                    {categorizeIngredients(item.ingredients)[category].map(
                      (item, idx) => (
                        <FormControlLabel
                          key={`${category}-${item.name}-${idx}`}
                          control={
                            <Checkbox
                              onChange={() => handleCheckboxChange(item.name)}
                            />
                          }
                          label={item.name}
                        />
                      )
                    )}
                  </FormGroup>
                </div>
              )
            )}
          </div>
          <div className="pt-5">
            <Button onClick={handleAddItemToCart} type="submit" variant="contained" disabled={false}>
              {true ? "Add to Cart" : "Out of Stock"}
            </Button>
          </div>
        </form>
      </AccordionDetails>
    </Accordion>
  );
};

export default MenuCard;
