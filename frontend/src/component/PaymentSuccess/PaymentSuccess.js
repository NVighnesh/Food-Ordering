import React, { useEffect } from 'react'
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { Button, Card } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearCartAction, findCart } from '../../component/State/Cart/Action';
import { useSelector } from 'react-redux';

export const PaymentSuccess = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authJwt = useSelector((s) => (s.auth && s.auth.jwt) || null);

  useEffect(() => {
  // clear temporary payment flag if present so App unload handlers resume
  try { localStorage.removeItem('payment_in_progress'); } catch (e) { /* ignore */ }
  const jwt = authJwt || localStorage.getItem('jwt');
    const run = async () => {
      // Attempt server-side clear first
      await dispatch(clearCartAction());
      // Always clear local cart state so UI updates instantly
      try { dispatch({ type: 'CLEAR_LOCAL_CART' }); } catch (e) { /* ignore */ }
      if (jwt) {
        dispatch(findCart(jwt));
      }
    };
    run();
  }, [dispatch, authJwt]);
  return (
    <div className='min-h-screen px-5'>
        <div className='flex flex-col items-center justify-center h-[90vh]'>
            <Card className='box w-full lg:w-1/4 flex flex-col items-center rounded-md p-5'>
                <TaskAltIcon className='text-green-500' sx={{ fontSize: 100 }} />
                <h2 className='text-lg font-semibold'>Payment Successful</h2>
                <p className='text-center py-3 text-gray-400'>Thank you for your order!</p>
                <p className='text-center py-3 text-gray-400'>Your order has been placed successfully.</p>
                <Button onClick={() => navigate("/")} variant="contained" className='py-5' sx={{margin:"1rem 0rem"}}>Go To Home</Button>
            </Card>
        </div>
        
    </div>
  )
}
