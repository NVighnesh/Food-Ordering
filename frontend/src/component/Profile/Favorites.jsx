import React from 'react'
import { useSelector } from 'react-redux';
import RestaurantCard from '../Restaurant/RestaurantCard'

export const Favorites = () => {
  // select only the auth slice to avoid returning the whole store
  const auth = useSelector((state) => state.auth) || {};
  const favorites = Array.isArray(auth.favorites) ? auth.favorites : [];
  return (
    <div>
    <h1 className='py-5 text-xl text-semibold text-center'>My Favorites</h1>
    <div className='flex justify-center gap-3 flex-wrap'>
      {favorites.map((item) => <RestaurantCard key={item.id || item._id} item={item}/>)}

    </div>
    </div>
  )
}

