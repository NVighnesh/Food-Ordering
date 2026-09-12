import React from "react";

import HomeIcon from "@mui/icons-material/Home";
import { Button, Card } from "@mui/material";

export const AddressCard = ({ item, showButton ,handleselectAddress}) => {
  const label = item?.label || "Home";
  const line = [item?.streetAddress || item?.street, item?.city, item?.state, item?.postalCode]
    .filter(Boolean)
    .join(", ");
  return (
    <Card className="flex gap-5 w-64 p-5 cursor-pointer" onClick={() => handleselectAddress(item)}>
      <HomeIcon />
      <div className="space-y-3 text-gray-500">
        <h1 className="font-semibold text-lg text-white">{label}</h1>
        <p className="text-sm break-words">{line}</p>
        {showButton && (
          <Button  variant="outlined" fullWidth onClick={(e) => {e.stopPropagation(); handleselectAddress(item);}}>select</Button>)}
      </div>
    </Card>
  );
};
