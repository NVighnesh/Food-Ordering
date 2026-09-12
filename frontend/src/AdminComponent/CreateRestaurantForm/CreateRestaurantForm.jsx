import { Button, CircularProgress, Grid, IconButton, TextField } from "@mui/material";
import { useFormik } from "formik";
import React, { useState } from "react";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CloseIcon from "@mui/icons-material/Close";
import { uploadImageToCloudinary } from "../util/UploadToCloudinary";
import { useDispatch } from "react-redux";
import { createRestaurant, getRestaurantByUserId } from "../../component/State/Restaurant/Action";
import { useNavigate } from "react-router-dom";

const initialValues = {
  name: "",
  description: "",
  cuisineType: "",
  streetAddress: "",
  city: "",
  stateProvince: "",
  postalCode: "",
  country: "",
  email: "",
  mobile: "",
  twitter: "",
  instagram: "",
  openingHours: "mon-sun : 10:00 AM - 10:00 PM",
  images: [],
};
function CreateRestaurantForm() {
  const [uploadImage, setUploadImage] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const jwt = localStorage.getItem("jwt");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const formik = useFormik({
    initialValues,
    onSubmit: async (values) => {
      setSubmitting(true);
      setSubmitError(null);
      // simple client-side validation
      if (!values.name || !values.streetAddress || !values.city || !values.country) {
        setSubmitError("Please fill the required fields: name, street address, city and country.");
        setSubmitting(false);
        return;
      }
      const data = {
        name: values.name,
        description: values.description,
        cuisineType: values.cuisineType,
        address: {
          // Send both legacy (streetAddress/stateProvince) and canonical (street/state) keys
          // so backend expecting either style will persist correctly. Remove legacy after migration.
          street: values.streetAddress,
          streetAddress: values.streetAddress,
          city: values.city,
          state: values.stateProvince,
          stateProvince: values.stateProvince,
          postalCode: values.postalCode,
          country: values.country,
        },
        contactInformation: {
          email: values.email,
          mobile: values.mobile,
          twitter: values.twitter,
          instagram: values.instagram,
        },
        openingHours: values.openingHours,
        images: values.images,
      };
      // log outgoing payload to help debug server 500s
      // eslint-disable-next-line no-console
      console.log("Submitting restaurant payload:", data);
      try {
  await dispatch(createRestaurant({ data, token: jwt }));
        // refresh user's restaurants so AdminRoute detects the new restaurant in store
        try {
          await dispatch(getRestaurantByUserId(jwt));
        } catch (refreshErr) {
          // eslint-disable-next-line no-console
          console.warn("Failed to refresh restaurants after create:", refreshErr);
        }
        // navigate to admin dashboard
        navigate("/admin/restaurants");
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Create restaurant failed", err);
        // pick best error message available
        if (err?.response?.status === 403) {
          setSubmitError("Forbidden: Your session may not have restaurant owner permissions yet. Try logging out and logging back in. If you just registered, wait a moment then retry.");
        } else {
          const serverMessage = err?.response?.data?.message || err?.response?.data || err?.message;
          setSubmitError(serverMessage || "Failed to create restaurant");
        }
      } finally {
        setSubmitting(false);
      }
    },
  });
  const handleImageChange = async (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    setUploadImage(true);
    try {
      // upload all files in parallel
      const uploads = await Promise.all(
        files.map(async (file) => {
          const url = await uploadImageToCloudinary(file);
          return url;
        })
      );

      formik.setFieldValue("images", [...(formik.values.images || []), ...uploads]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Image upload failed", err);
    } finally {
      setUploadImage(false);
      // allow selecting same file again
      e.target.value = "";
    }
  };

  const handleRemoveImage = (index) => {
    const updatedImages = [...(formik.values.images || [])];
    if (index < 0 || index >= updatedImages.length) return;
    updatedImages.splice(index, 1);
    formik.setFieldValue("images", updatedImages);
  };

  const handleReplaceImage = async (index, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadImage(true);
    try {
      const url = await uploadImageToCloudinary(file);
      const updated = [...(formik.values.images || [])];
      updated[index] = url;
      formik.setFieldValue("images", updated);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Replace upload failed", err);
    } finally {
      setUploadImage(false);
      e.target.value = "";
    }
  };
  return (
    <div className="py-10 px-5 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="font-bold text-2xl text-center py-2">
          Add New Restaurant
        </h1>
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <Grid container spacing={2}>
            <Grid item className="flex flex-wrap gap-5" xs={12}>
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
                {(formik.values.images || []).map((image, index) => (
                  <div className="relative" key={image + index}>
                    <img className="w-24 h-24 object-cover rounded-md" src={image} alt={`uploaded-${index}`} />

                    <input
                      accept="image/*"
                      id={`replace-${index}`}
                      style={{ display: "none" }}
                      type="file"
                      onChange={(e) => handleReplaceImage(index, e)}
                    />
                    <label htmlFor={`replace-${index}`} className="absolute left-1 bottom-1 z-10">
                      <IconButton size="small" sx={{ background: "rgba(255,255,255,0.8)" }}>
                        <AddPhotoAlternateIcon sx={{ fontSize: "1rem" }} />
                      </IconButton>
                    </label>

                    <IconButton
                      size="small"
                      sx={{ position: "absolute", top: 0, right: 0, outline: "none" }}
                      onClick={() => handleRemoveImage(index)}
                    >
                      <CloseIcon sx={{ fontSize: "1rem", color: "grey" }} />
                    </IconButton>
                  </div>
                ))}
              </div>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="name"
                name="name"
                label="Name"
                variant="outlined"
                onChange={formik.handleChange}
                value={formik.values.name}
              ></TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="description"
                name="description"
                label="Description"
                variant="outlined"
                onChange={formik.handleChange}
                value={formik.values.description}
              ></TextField>
            </Grid>
            <Grid item xs={12} lg={6}>
              <TextField
                fullWidth
                id="cuisineType"
                name="cuisineType"
                label="Cuisine Type"
                variant="outlined"
                onChange={formik.handleChange}
                value={formik.values.cuisineType}
              ></TextField>
            </Grid>
            <Grid item xs={12} lg={6}>
              <TextField
                fullWidth
                id="openingHours"
                name="openingHours"
                label="Opening Hours"
                variant="outlined"
                onChange={formik.handleChange}
                value={formik.values.openingHours}
              ></TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="streetAddress"
                name="streetAddress"
                label="Street Address"
                variant="outlined"
                onChange={formik.handleChange}
                value={formik.values.streetAddress}
              ></TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="city"
                name="city"
                label="City"
                variant="outlined"
                onChange={formik.handleChange}
                value={formik.values.city}
              ></TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="stateProvince"
                name="stateProvince"
                label="State Province"
                variant="outlined"
                onChange={formik.handleChange}
                value={formik.values.stateProvince}
              ></TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="postalCode"
                name="postalCode"
                label="Postal Code"
                variant="outlined"
                onChange={formik.handleChange}
                value={formik.values.postalCode}
              ></TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="country"
                name="country"
                label="Country"
                variant="outlined"
                onChange={formik.handleChange}
                value={formik.values.country}
              ></TextField>
            </Grid>
            <Grid item xs={12} lg={6}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email"
                variant="outlined"
                onChange={formik.handleChange}
                value={formik.values.email}
              ></TextField>
            </Grid>
            <Grid item xs={12} lg={6}>
              <TextField
                fullWidth
                id="mobile"
                name="mobile"
                label="Mobile"
                variant="outlined"
                onChange={formik.handleChange}
                value={formik.values.mobile}
              ></TextField>
            </Grid>
            <Grid item xs={12} lg={6}>
              <TextField
                fullWidth
                id="instagram"
                name="instagram"
                label="Instagram"
                variant="outlined"
                onChange={formik.handleChange}
                value={formik.values.instagram}
              ></TextField>
            </Grid>

            <Grid item xs={12} lg={6}>
              <TextField
                fullWidth
                id="twitter"
                name="twitter"
                label="Twitter"
                variant="outlined"
                onChange={formik.handleChange}
                value={formik.values.twitter}
              ></TextField>
            </Grid>
          </Grid>
        </form>
        <Grid item xs={12} className="pt-4">
          {submitError && <div className="text-sm text-red-600 mb-2">{submitError}</div>}
          <Button
            onClick={formik.handleSubmit}
            variant="contained"
            color="primary"
            type="submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> Creating...
              </>
            ) : (
              "Create Restaurant"
            )}
          </Button>
        </Grid>
      </div>
    </div>
  );
}

export default CreateRestaurantForm;
