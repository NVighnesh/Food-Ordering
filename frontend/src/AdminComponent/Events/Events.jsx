import { Box, Button, Grid, Modal, TextField } from "@mui/material";
import React from "react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { createEventAction, getRestaurantsEvents, deleteEventAction } from "../../component/State/Restaurant/Action";
import { EventCard } from "../../component/Profile/EventCard";

// initial form values reused to reset the form after submit
const initialFormValues = {
  image: "",
  location: "",
  name: "",
  startedAt: null,
  endsAt: null,
};

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

export const Events = () => {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [formValues, setFormValues] = React.useState(initialFormValues);
  const dispatch = useDispatch();
    
    const jwt = localStorage.getItem("jwt");
    const { restaurant} = useSelector((store) => store);
    const restaurantEvents = restaurant?.restaurantEvents || [];

  React.useEffect(() => {
    const restId = restaurant?.usersRestaurants?.[0]?.id;
    if (restId) dispatch(getRestaurantsEvents({ restaurantId: restId, jwt }));
  }, [restaurant?.usersRestaurants, dispatch, jwt]);

    const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    // format dates before sending
    const payload = {
      ...formValues,
      // send ISO strings so backend LocalDateTime parses reliably
      startedAt: formValues.startedAt ? dayjs(formValues.startedAt).toISOString() : null,
      endsAt: formValues.endsAt ? dayjs(formValues.endsAt).toISOString() : null,
    };
    // eslint-disable-next-line no-console
    console.log("Submitting event:", payload);
    dispatch(createEventAction({
      data: payload,
      restaurantId: restaurant?.usersRestaurants?.[0]?.id,
      jwt,
    }));
  // TODO: send payload to backend
  // close modal and reset form so the button can open a fresh form
  setFormValues(initialFormValues);
  setOpen(false);
  };

  const handleFormChange = (e) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleDataChange = (date, dateType) => {
    // store raw Dayjs object (DateTimePicker expects this)
    setFormValues({ ...formValues, [dateType]: date });
  };
  return (
    <div>
      <div className="p-5">
        <Button onClick={handleOpen} variant="contained">Create New Event</Button>
        <div className="mt-6">
          {restaurantEvents.length === 0 ? (
            <p className="text-gray-400">No events created for this restaurant.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {restaurantEvents.map((ev) => (
                <EventCard
                  key={ev.id || ev._id}
                  event={ev}
                  canDelete={true}
                  onDelete={(id) => dispatch(deleteEventAction({ eventId: id, jwt }))}
                />
              ))}
            </div>
          )}
        </div>
        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    name="image"
                    label="Image URL"
                    variant="outlined"
                    fullWidth
                    value={formValues.image}
                    onChange={handleFormChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="location"
                    label="Location"
                    variant="outlined"
                    fullWidth
                    value={formValues.location}
                    onChange={handleFormChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="name"
                    label="Event Name"
                    variant="outlined"
                    fullWidth
                    value={formValues.name}
                    onChange={handleFormChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateTimePicker
                      renderInput={(props) => <TextField {...props} />}
                      label="start Date and Time"
                      value={formValues.startedAt}
                      onChange={(newValue) =>
                        handleDataChange(newValue, "startedAt")
                      }
                      inputFormat="MM/dd/yyyy hh:mm a"
                      className="w-full"
                      sx={{ width: "100%" }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateTimePicker
                      renderInput={(props) => <TextField {...props} />}
                      label="End Date and Time"
                      value={formValues.endsAt}
                      onChange={(newValue) =>
                        handleDataChange(newValue, "endsAt")
                      }
                      inputFormat="MM/dd/yyyy hh:mm a"
                      className="w-full"
                      sx={{ width: "100%" }}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>
              <Grid item xs={12} className="pt-4">
                <Button variant="contained" color="primary" type="submit">
                  Submit
                </Button>
              </Grid>
            </form>
          </Box>
        </Modal>
      </div>
    </div>
  );
};
