import { Button, TextField, Typography } from "@mui/material";
import { Field, Form, Formik } from "formik";
import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "../State/Authentication/Action";

const initialValues = {
  email: "",
  password: "",
};

export const LoginForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
  const handleSubmit = (values) => {
      // preserve the location the user attempted to access so we can redirect back after login
      const returnTo = location.state?.from?.pathname || "/";
      dispatch(loginUser({ userData: values, navigate, returnTo }));


  };
  return (
    <div>
      <Typography variant="h5" className="text-center">
        Login 
      </Typography>
      <Formik onSubmit={handleSubmit} initialValues={initialValues}>
        <Form>
          <Field
            as={TextField}
            name="email"
            label="email"
            fullWidth
            variant="outlined"
          />
          <Field
            as={TextField}
            name="password"
            label="password"
            fullWidth
            variant="outlined"
            margin="normal"
          />
          <Button sx={{mt:2,padding:"1rem"}} fullWidth variant="contained" type="submit">Login</Button>
        </Form>
      </Formik>
        <Typography variant="body2" align="center"sx={{mt:3}}>
            Don't have an account? <Button size="small" onClick={()=>navigate("/account/register")}>Register</Button>
        </Typography>
    </div>
  );
};
