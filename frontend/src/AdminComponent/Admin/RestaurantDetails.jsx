import { Button, Card, CardContent, CardHeader, Grid, CircularProgress } from "@mui/material";
import React, { useState } from "react";
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import FacebookIcon from '@mui/icons-material/Facebook';
import { useDispatch, useSelector } from "react-redux";
import { updateRestaurantStatus } from "../../component/State/Restaurant/Action";
import { normalizeAddress } from "../../component/utils/addressNormalizer";

export const RestaurantDetails = () => {
  const { restaurant } = useSelector((store) => store);
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const current = restaurant?.usersRestaurants?.[0];
  const addr = normalizeAddress(current?.address);
  const [toggling, setToggling] = useState(false);

  const handleRestaurantStatus = async () => {
    if (!current) return;
    try {
      setToggling(true);
      await dispatch(updateRestaurantStatus({ restaurantId: current.id, jwt }));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to toggle status", e);
    } finally {
      setToggling(false);
    }
  };
  return (
    <div className="px-5 pb-10">
      <div className="max-w-6xl mx-auto">
      <div className="py-5 flex justify-center items-center gap-5">
        <h1 className="text-2xl lg:text-7xl text-center font-bold p-5">
          {current?.name || "Restaurant"}
        </h1>
        <div>
          <Button
            color={current?.open ? "primary" : "error"}
            className="py-[1rem] px-[2rem]"
            variant="contained"
            onClick={handleRestaurantStatus}
            size="large"
            disabled={!current || toggling}
          >
            {toggling ? <CircularProgress size={20} color="inherit" /> : current?.open ? "Close" : "Open"}
          </Button>
        </div>
      </div>
  <Grid container spacing={2} className="w-full max-w-8xl mx-auto">
        <Grid item xs={12} className="w-full">
          <Card className="w-full">
            <CardHeader
              title={<span className="text-gray-300">Restaurant </span>}
            />
            <CardContent>
              <div className="space-y-4 text-gray-200">
                <div className="flex">
                  <p className="w-48">Owner</p>
                  <p className="text-gray-400">
                    <span className="pr-5">-</span>
                    {current?.owner?.fullName || "N/A"}
                  </p>
                </div>
                <div className="flex">
                  <p className="w-48">Restaurant Name</p>
                  <p className="text-gray-400">
                    <span className="pr-5">-</span>
                    {current?.name || "N/A"}
                  </p>
                </div>
                <div className="flex">
                  <p className="w-48">Cuisine Type</p>
                  <p className="text-gray-400">
                    <span className="pr-5">-</span>
                    {current?.cuisineType || "N/A"}
                  </p>
                </div>
                <div className="flex">
                  <p className="w-48">Opening Hours</p>
                  <p className="text-gray-400">
                    <span className="pr-5">-</span>
                    {current?.openingHours || "N/A"}
                  </p>
                </div>
                <div className="flex">
                  <p className="w-48">status</p>
                  <p className="text-gray-400">
                    <span className="pr-5">-</span>
                    {current?.open ? (
                      <span className="px-5 py-2 rounded-full bg-green-400 text-gray-950">
                        Open
                      </span>
                    ) : (
                      <span className="px-5 py-2 rounded-full bg-red-400 text-gray-950">
                        Closed
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Card className="w-full">
            <CardHeader
              title={<span className="text-gray-300">Address </span>}
            />
            <CardContent>
              <div className="space-y-4 text-gray-200">
                <div className="flex">
                  <p className="w-48">Country</p>
                  <p className="text-gray-400">
                    <span className="pr-5">-</span>
                    {addr?.country || "N/A"}
                  </p>
                </div>
                <div className="flex">
                  <p className="w-48">City</p>
                  <p className="text-gray-400">
                    <span className="pr-5">-</span>
                    {addr?.city || "N/A"}
                  </p>
                </div>
                <div className="flex">
                  <p className="w-48">Postal Code</p>
                  <p className="text-gray-400">
                    <span className="pr-5">-</span>
                    {addr?.postalCode || "N/A"}
                  </p>
                </div>
                <div className="flex">
                  <p className="w-48">Street Address</p>
                  <p className="text-gray-400">
                    <span className="pr-5">-</span>
                    {/* Prefer canonical street, fallback to streetAddress */}
                    {addr?.street || addr?.streetAddress || "N/A"}
                  </p>
                </div>
               
              </div>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Card className="w-full">
            <CardHeader
              title={<span className="text-gray-300">Contact </span>}
            />
            <CardContent>
              <div className="space-y-4 text-gray-200">
                <div className="flex">
                  <p className="w-48">Email</p>
                  <p className="text-gray-400">
                    <span className="pr-5">-</span>
                    {current?.contactInformation?.email || "N/A"}
                  </p>
                </div>
                <div className="flex">
                  <p className="w-48">Mobile</p>
                  <p className="text-gray-400">
                    <span className="pr-5">-</span>
                    {current?.contactInformation?.mobile || "N/A"}
                  </p>
                </div>
                <div className="flex">
                  <p className="w-48">Social</p>
                  <div className="flex items-center pb-2 text-gray-400 gap-2">
                    <span className="pr-5">-</span>
                    {current?.contactInformation?.instagram && (
                      <a href={current.contactInformation.instagram} target="_blank" rel="noreferrer"><InstagramIcon sx={{fontSize:"2rem"}}/></a>
                    )}
                    {current?.contactInformation?.twitter && (
                      <a href={current.contactInformation.twitter} target="_blank" rel="noreferrer"><TwitterIcon sx={{fontSize:"2rem"}}/></a>
                    )}
                    {current?.contactInformation?.facebook && (
                      <a href={current.contactInformation.facebook} target="_blank" rel="noreferrer"><FacebookIcon sx={{fontSize:"2rem"}}/></a>
                    )}
                    {current?.contactInformation?.linkedin && (
                      <a href={current.contactInformation.linkedin} target="_blank" rel="noreferrer"><LinkedInIcon sx={{fontSize:"2rem"}}/></a>
                    )}
                  </div>
                  
                </div>
                
              
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </div>
    </div>
  );
};
