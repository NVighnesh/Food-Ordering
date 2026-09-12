import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAddresses, createAddress, selectAddress, deleteAddress, updateAddress } from '../State/Address/Action';
import { Box, Button, Card, Grid, Modal, TextField, Typography } from '@mui/material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 420,
  bgcolor: 'background.paper',
  outline: 'none',
  boxShadow: 24,
  p: 4,
};

const initial = { streetAddress: '', city: '', state: '', postalCode: '', country: 'India' };

const Address = () => {
  const dispatch = useDispatch();
  const addresses = useSelector((state) => state.addresses) || { list: [], selected: null };
  const auth = useSelector((state) => state.auth) || {};
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    if (jwt) dispatch(getAddresses({ jwt }));
  }, [dispatch]);

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleOpen = (addr = null) => {
    setEditing(addr);
    setForm(addr ? {
      streetAddress: addr.streetAddress || addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      postalCode: addr.postalCode || '',
      country: addr.country || 'India'
    } : initial);
    setOpen(true);
  };

  const handleSave = () => {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) return;
    const payload = { ...form, fullName: auth.user?.fullName };
    if (editing?.id) {
  dispatch(updateAddress({ jwt, id: editing.id, data: payload }));
    } else {
      dispatch(createAddress({ jwt, data: payload }));
    }
    setOpen(false);
  };

  const isSelected = id => addresses.selected && addresses.selected.id === id;

  return (
    <Box className="space-y-6 p-4">
      <Box className="flex justify-between items-center">
        <Typography variant="h6">Address</Typography>
        <Button variant="contained" onClick={() => handleOpen()}>Add Address</Button>
      </Box>
  <Grid container spacing={2}>
        {(addresses.list || []).map(a => (
          <Grid item key={a.id} xs={12} md={6} lg={4}>
            <Card className={`p-4 space-y-2 border ${isSelected(a.id) ? 'border-pink-500' : 'border-transparent'}`}
                  onClick={() => dispatch(selectAddress(a))}>
              <Typography className="font-semibold">{a.label || 'Home'}</Typography>
              <Typography variant="body2" className="text-gray-400 break-words">
                {[a.streetAddress || a.street, a.city, a.state, a.postalCode].filter(Boolean).join(', ')}
              </Typography>
              <div className="flex gap-2 pt-2">
                <Button size="small" variant="outlined" onClick={e => { e.stopPropagation(); handleOpen(a); }}>Edit</Button>
                <Button size="small" color="error" variant="outlined" onClick={e => { e.stopPropagation(); if(window.confirm('Delete this address?')) { dispatch(deleteAddress({ jwt: localStorage.getItem('jwt'), id: a.id })); } }}>Delete</Button>
              </div>
            </Card>
          </Grid>
        ))}
        {addresses.error && (
          <Grid item xs={12}>
            <div className="p-4 bg-red-900 text-white rounded">
              <div className="font-semibold">Error deleting address</div>
              <div>{typeof addresses.error === 'string' ? addresses.error : addresses.error?.message || 'Unable to delete address'}</div>
              {addresses.error?.referencingOrders && addresses.error.referencingOrders.length > 0 && (
                <div className="mt-2">
                  <div className="font-semibold">Referencing orders:</div>
                  <ul className="list-disc ml-4">
                    {addresses.error.referencingOrders.map(o => (
                      <li key={o.id}>Order #{o.id} - {o.orderStatus || 'unknown'}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Grid>
        )}
        {!addresses.loading && (addresses.list || []).length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body2" className="text-gray-500">No addresses yet.</Typography>
          </Grid>
        )}
      </Grid>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={style} className="space-y-4">
          <Typography variant="subtitle1">{editing ? 'Edit Address' : 'Add Address'}</Typography>
          <TextField label="Street" name="streetAddress" value={form.streetAddress} onChange={handleChange} fullWidth />
          <TextField label="City" name="city" value={form.city} onChange={handleChange} fullWidth />
            <TextField label="State" name="state" value={form.state} onChange={handleChange} fullWidth />
          <TextField label="Postal Code" name="postalCode" value={form.postalCode} onChange={handleChange} fullWidth />
          <TextField label="Country" name="country" value={form.country} onChange={handleChange} fullWidth />
          <div className="flex gap-2 justify-end">
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSave}>{editing ? 'Save' : 'Add'}</Button>
          </div>
        </Box>
      </Modal>
    </Box>
  );
};

export default Address;