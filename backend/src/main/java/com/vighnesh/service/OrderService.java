package com.vighnesh.service;

import com.vighnesh.model.Order;
import com.vighnesh.model.User;
import com.vighnesh.request.OrderRequest;

import java.util.List;

public interface OrderService {

    public Order createOrder(OrderRequest order, User user) throws Exception;

    public Order updateOrder(Long orderId,String orderStatus)throws Exception;

    public void calcelOrder(Long orderId)throws Exception;

    public List<Order> getUserOrder(Long userId) throws Exception;
    public List<Order> getRestaurantOrders(Long restaurantId,String orderStatus) throws Exception;

    public  Order findOrderById(Long orderId) throws Exception;
}
