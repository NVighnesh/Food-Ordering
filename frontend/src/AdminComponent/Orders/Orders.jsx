import {
  Card,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { Form } from "react-router-dom";
import OrderTable from "./OrderTable";

const orderStatus = [
  { label: "Pending", value: "PENDING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Out for Delivery", value: "OUT FOR DELIVERY" },
  { label: "All", value: "ALL" },
];
export const Orders = () => {
  const [filterValue, setFilterValue] = useState("ALL");
  const handleFilter = (e, value) => {
    setFilterValue(value);
  };
  return (
    <div className="px-2">
      <Card className="p-5">
        <Typography sx={{ paddingBottom: "1rem" }} variant="h5">
          order Status
        </Typography>
        <FormControl>
          <RadioGroup
            onChange={handleFilter}
            row
            name="orderStatus"
            value={filterValue}
          >
            {orderStatus.map((item) => (
              <FormControlLabel
                key={item.label}
                value={item.value}
                control={<Radio />}
                label={item.label}
                sx={{ color: "gray" }}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </Card>
      <OrderTable filterValue={filterValue} />
    </div>
  );
};
