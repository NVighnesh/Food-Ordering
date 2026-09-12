import { Box, Divider, Grid, Modal, TextField } from "@mui/material";
import React from "react";
import { CartItem } from "./CartItem";
import { AddressCard } from "./AddressCard";
import { Button, Card } from "@mui/material";
import AddLocationAltIcon from "@mui/icons-material/AddLocationAlt";
import { Field, Form, Formik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { createOrder } from "../State/Order/Action";
import { createAddress, getAddresses, selectAddress } from "../State/Address/Action";

//import * as Yup from "yup";

export const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  outline: "none",
  boxShadow: 24,
  p: 4,
};

const initialValues = {
  streetAddress: "",
  state: "",
  pincode: "",
  city: "",
};
// const validationSchema = Yup.object.shape({
//     streetAdress: Yup.string().required("Street Address is required"),
//     state: Yup.string().required("State is required"),
//     pincode: Yup.string().required("Pincode is required"),

//     city: Yup.string().required("City is required"),
// })
// removed unused local handleSubmit stub

export const Cart = () => {
  const addresses = useSelector((state) => state.addresses) || { list: [], selected: null };
  const createOrderUsingSelectedAdress = (address) => {
    if(!address) return;
    dispatch(selectAddress(address));
  };
  const handleOpenAdressModel = () => {
    setOpen(true);
  };
  const [open, setOpen] = React.useState(false);
  const cart = useSelector((state) => state.cart) || { cartItems: [] };
  const auth = useSelector((state) => state.auth) || {};
  const dispatch=useDispatch();
  const handleClose = () => setOpen(false);
  const handleSubmit = (values,{resetForm}) => {
    const jwt = localStorage.getItem("jwt");
    const data = {
      streetAddress: values.streetAddress,
      city: values.city,
      state: values.state,
      postalCode: values.pincode,
      country: "india",
      fullName: auth.user?.fullName,
    };
    dispatch(createAddress({ jwt, data }));
    resetForm();
    handleClose();
  };

  const authJwt = useSelector((s) => (s.auth && s.auth.jwt) || null);
  React.useEffect(()=>{
    if(authJwt){
      dispatch(getAddresses({jwt: authJwt}));
    }
  },[dispatch, authJwt]);

  // Normalize cart items so components can rely on top-level convenience fields
  const normalizedItems = (cart?.cartItems || []).map((it) => {
    const food = it.food || {};
    const name = it.name || food.name || it.foodName || "";
    const images = it.images || food.images || (it.image && [it.image]) || it.foodImages || [];
    const price = Number(it.price ?? food.price ?? it.totalPrice ?? 0);
    return { ...it, food, name, images, price };
  });

  // compute subtotal once and reuse; prevents placing orders with zero total
  const subtotal = normalizedItems.reduce((s, it) => s + (Number(it.totalPrice || it.price) || 0), 0);

  const placeOrder = () => {
  const jwt = authJwt;
    if(!addresses.selected){
      return;
    }
    const safeAddress = {
  street: addresses.selected.street || addresses.selected.streetAddress || "",
  city: addresses.selected.city || "",
  state: addresses.selected.state || "",
  postalCode: addresses.selected.postalCode || "",
  country: addresses.selected.country || "India",
  // include id if present so backend can reuse existing address instead of creating duplicates
  ...(addresses.selected.id ? { id: addresses.selected.id } : {}),
  ...(addresses.selected._id ? { id: addresses.selected._id } : {}),
    };
    // compute pricing breakdown and build items array so backend receives full order
    const subtotal = normalizedItems.reduce((s,it)=>s+(Number(it.totalPrice||it.price)||0),0);
    const deliveryFee = subtotal === 0 ? 0 : Math.min(99, Math.max(15, Math.round(subtotal * 0.07)));
    const platformFee = subtotal === 0 ? 0 : Math.min(49, Math.round(subtotal * 0.03) + 5);
    const tax = subtotal === 0 ? 0 : Math.round(subtotal * 0.05);
    const total = subtotal + deliveryFee + platformFee + tax;

    const items = (normalizedItems || []).map(it => ({
      // provide multiple fallback keys for server compatibility
      productId: it.food?.id || it.food?._id || it.id,
      foodId: it.food?.id || it.food?._id || it.id,
      menuId: it.menuId || undefined,
      name: it.name || undefined,
      quantity: Number(it.quantity || it.qty || it.count || 1),
      unitPrice: Number(it.price || 0),
      totalPrice: Number(it.totalPrice || it.price || 0),
    }));

    const restaurantId = normalizedItems?.[0]?.food?.restaurant?.id || normalizedItems?.[0]?.restaurant?.id;
    if (!restaurantId) {
      console.error('placeOrder failed: missing restaurantId. payload items:', normalizedItems);
      return;
    }

    const data = {
      token: jwt,
      order: {
        // prefer nested restaurant on food, fall back to top-level restaurant if present
        restaurantId,
        deliveryAddress: safeAddress,
        customerName: auth.user?.fullName || auth.user?.name || undefined,
        subtotal,
        deliveryFee,
        platformFee,
        tax,
        total,
        items,
      }
  };
    dispatch(createOrder(data));
  }

  return (
    <>
      <main className="lg:flex justify-between">
        <section className="lg:w-[30%] space-y-6 lg:min-h-screen pt-10">
          {normalizedItems.map((item) => (
            <CartItem key={item?.id || Math.random()} item={item} />
          ))}

          <Divider />
          <div className=" billDetails px-5 text-sm">
            <p className="font-extrabold py-5">Bill Details</p>
            <div className="space-y-3">
              <div className="flex justify-between text-grey-400">
                <p>Item Total</p>
                <p>₹{subtotal}</p>
              </div>
              {(() => {
                const base = subtotal;
                const deliveryFee = base === 0 ? 0 : Math.min(99, Math.max(15, Math.round(base * 0.07)));
                const platformFee = base === 0 ? 0 : Math.min(49, Math.round(base * 0.03) + 5);
                const tax = base === 0 ? 0 : Math.round(base * 0.05); // 5% GST approximation
                const grand = base + deliveryFee + platformFee + tax;
                return (
                  <>
                    <div className="flex justify-between text-grey-400">
                      <p>Delivery Fee</p>
                      <p>₹{deliveryFee}</p>
                    </div>
                    <div className="flex justify-between text-grey-400">
                      <p>Platform Fee</p>
                      <p>₹{platformFee}</p>
                    </div>
                    <div className="flex justify-between text-grey-400">
                      <p>GST & Charges</p>
                      <p>₹{tax}</p>
                    </div>
                    <Divider />
                    <div className="flex justify-between text-grey-400 font-semibold">
                      <p>Total pay</p>
                      <p>₹{grand}</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </section>
        <Divider orientation="vertical" flexItem />
        <section className="lg:w-[70%] flex justify-center px-5  pb-10 lg:pb-0">
          <div>
            <h1 className="font-semibold text-2xl text-center py-10">
              Choose Delivery Address
            </h1>
            <div className="flex gap-5 flex-wrap justify-center">
                {(addresses.list || []).map((item) => (
                <AddressCard
                  key={item.id}
                  handleselectAddress={createOrderUsingSelectedAdress}
                  item={item}
                  showButton={true}
                />
              ))}
              <Card className="flex gap-5 w-64 p-5">
                <AddLocationAltIcon />
                <div className="space-y-3 text-gray-500">
                  <h1 className="font-semibold text-lg text-white">
                    Add New Adress
                  </h1>

                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleOpenAdressModel}
                  >
                    Add
                  </Button>
                </div>
              </Card>
            </div>
            <div className="pt-8 flex justify-center">
              <Button
                variant="contained"
                color="secondary"
                disabled={!addresses.selected || normalizedItems.length===0 || subtotal===0}
                onClick={placeOrder}
              >
                Place Order
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Formik
            initialValues={initialValues}
            //  validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            <Form>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Field
                  as={TextField}
                  name="streetAddress"
                  label="Street Address"
                  fullWidth
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <Field
                  as={TextField}
                  name="state"
                  label="state"
                  fullWidth
                  variant="outlined"
                  // error={!ErrorMessage("streetAdress")}
                  // helperText={
                  //     <ErrorMessage>
                  //         {(msg)=><span className="text-red-600"></span>}
                  //         </ErrorMessage>
                  // }
                />
              </Grid>
              <Grid item xs={12}>
                <Field
                  as={TextField}
                  name="city"
                  label="City"
                  fullWidth
                  variant="outlined"
                  // error={!ErrorMessage("streetAdress")}
                  // helperText={
                  //     <ErrorMessage>
                  //         {(msg)=><span className="text-red-600"></span>}
                  //         </ErrorMessage>
                  // }
                />
              </Grid>
              <Grid item xs={12}>
                <Field
                  as={TextField}
                  name="pincode"
                  label="Pincode"
                  fullWidth
                  variant="outlined"
                  // error={!ErrorMessage("streetAdress")}
                  // helperText={
                  //     <ErrorMessage>
                  //         {(msg)=><span className="text-red-600"></span>}
                  //         </ErrorMessage>
                  // }
                />
              </Grid>
              <Grid item xs={12} style={{ width: "100%" }}>
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  color="primary"
                >
                  Save Address
                </Button>
              </Grid>
              {addresses.selected && (
                <Grid item xs={12}>
                  <Button fullWidth variant="contained" color="success" onClick={placeOrder}>
                    Place Order To This Address
                  </Button>
                </Grid>
              )}
            </Grid>
            </Form>
          </Formik>
        </Box>
      </Modal>
    </>
  );
};
