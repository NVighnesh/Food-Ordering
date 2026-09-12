import React from 'react'
import MenuTable from '../Menu/MenuTable'
import OrderTable from '../Orders/OrderTable'

export const RestaurantDashboard = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <OrderTable />
        </div>
        <div className="flex-1 min-w-0">
          <MenuTable />
        </div>
      </div>
    </div>
  )
}
