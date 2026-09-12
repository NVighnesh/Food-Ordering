import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { EventCard } from './EventCard'
import { getAllEvents } from '../State/Restaurant/Action'
import { useNavigate } from 'react-router-dom'

const Events = () => {
  const dispatch = useDispatch();
  const restaurant = useSelector((state) => state.restaurant) || {};
  const events = restaurant?.events || [];
  const navigate = useNavigate();
  const jwt = localStorage.getItem('jwt');

  useEffect(() => {
    dispatch(getAllEvents({ jwt }));
  }, [dispatch, jwt]);

  return (
    <div className='mt-5 px-5 flex flex-wrap gap-5'>
      {events.length === 0 ? (
        <p className='text-gray-400'>No upcoming events</p>
      ) : (
        events.map((ev) => (
          <EventCard
            key={ev.id || ev._id}
            event={ev}
            onNavigate={(eventObj) => {
              // Extract restaurant id and metadata
              const restaurant = eventObj.restaurant || eventObj.rest || {};
              const rid = eventObj.restaurantId || eventObj.restaurant_id || eventObj.restaurantID || restaurant.id || restaurant._id;
              if (!rid) {
                if (process.env.NODE_ENV !== 'production') console.warn('Event missing restaurant id field', eventObj);
                return;
              }
              const city = (restaurant.address && (restaurant.address.city || restaurant.address.town)) || restaurant.city || eventObj.city || 'unknown';
              const name = restaurant.name || eventObj.restaurantName || eventObj.name || 'restaurant';
              const encode = (v) => encodeURIComponent(String(v).replace(/\s+/g, ' ').trim());
              navigate(`/restaurant/${encode(city)}/${encode(name)}/${rid}`);
            }}
          />
        ))
      )}
    </div>
  )
}

export default Events