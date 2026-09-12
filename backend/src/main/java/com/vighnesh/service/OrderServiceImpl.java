package com.vighnesh.service;

import com.vighnesh.model.*;
import com.vighnesh.repository.AddressRepository;
import com.vighnesh.repository.OrderRepository;
import com.vighnesh.repository.OrderitemRepository;
import com.vighnesh.repository.UserRepository;
import com.vighnesh.request.OrderRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService{

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderitemRepository orderitemRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantService restaurantService;

    @Autowired
    private CartService cartService;

    @Autowired
    private NotificationService notificationService;

    @Override
    public Order createOrder(OrderRequest order, User user) throws Exception {
        Address shippAddress=order.getDeliveryAddress();
        Address savedAddress=addressRepository.save(shippAddress);
        if(!user.getAddresses().contains(savedAddress)){
            user.getAddresses().add(savedAddress);
            userRepository.save(user);
        }
        Restaurant restaurant=restaurantService.findRestaurantById(order.getRestaurantId());
        Order createdOrder=new Order();
        createdOrder.setCustomer(user);
        createdOrder.setCreatedAt(new Date());
        createdOrder.setOrderStatus("Pending");
        createdOrder.setDeliveryAddress(savedAddress);
        createdOrder.setRestaurant(restaurant);

        Cart cart=cartService.findCartByUserId(user.getId());

        List<OrderItem> orderItems=new ArrayList<>();
        for(CartItem cartItem : cart.getItems()){
            OrderItem orderItem=new OrderItem();
            orderItem.setFood(cartItem.getFood());
            orderItem.setQuantity(cartItem.getQuantity());
            // Create a defensive copy of ingredients to avoid reusing the same collection
            // instance across multiple OrderItem entities which causes Hibernate errors.
            orderItem.setIngredients(cartItem.getIngredients() != null ? new ArrayList<>(cartItem.getIngredients()) : null);
            orderItem.setTotalPrice(cartItem.getTotalPrice());
            // set back-reference so cascade will persist item linked to order
            orderItem.setOrder(createdOrder);
            orderItems.add(orderItem);
        }
        Long totalPrice=cartService.calculateCartTotals(cart);
        createdOrder.setItems(orderItems);
        createdOrder.setTotalPrice(totalPrice);
        // new: set totalItem (sum of quantities) and totalAmount (alias of totalPrice for legacy field)
        int totalItemCount = orderItems.stream().mapToInt(OrderItem::getQuantity).sum();
        createdOrder.setTotalItem(totalItemCount);
        createdOrder.setTotalAmount(totalPrice);

        // save order (cascade will persist items)
        Order savedOrder=orderRepository.save(createdOrder);
        restaurant.getOrders().add(savedOrder);

        // clear the user's cart after successful order placement
        try{
            cartService.clearCart(user.getId());
        }catch(Exception ex){
            // don't fail the order if cart clearing fails - log or ignore
        }

        // create notification for customer
        try{
            String title = "Order placed";
            String body = "Your order #" + savedOrder.getId() + " has been placed.";
            notificationService.createNotificationForUser(user, title, body, "ORDER", "{\"orderId\":"+savedOrder.getId()+"}");
        }catch(Exception ex){
            // swallow notification errors to not break order flow
        }

        // notify restaurant owner if exists
        try{
            if(restaurant.getOwner()!=null){
                User owner = restaurant.getOwner();
                String title = "New order received";
                String body = "New order #" + savedOrder.getId() + " has been placed for your restaurant.";
                notificationService.createNotificationForUser(owner, title, body, "ORDER", "{\"orderId\":"+savedOrder.getId()+"}");
            }
        }catch(Exception ex){
            // ignore
        }

        return savedOrder;
    }

    @Override
    public Order updateOrder(Long orderId, String orderStatus) throws Exception {
        Order order = findOrderById(orderId);
        if (orderStatus.equals("OUT FOR DELIVERY") || orderStatus.equals("DELIVERED") || orderStatus.equals("COMPLETED") ||
                orderStatus.equals("PENDING")
        ) {
            order.setOrderStatus(orderStatus);
            Order updated = orderRepository.save(order);

            // notify customer about status change
            try{
                User customer = updated.getCustomer();
                String title = "Order status updated";
                String body = "Your order #" + updated.getId() + " status changed to " + updated.getOrderStatus();
                notificationService.createNotificationForUser(customer, title, body, "ORDER_STATUS", "{\"orderId\":"+updated.getId()+",\"status\":\""+updated.getOrderStatus()+"\"}");
            }catch(Exception ex){
                // ignore notification errors
            }

            return updated;

        }
        throw new Exception("Invalid order status please select valid one");
    }

    @Override
    public void calcelOrder(Long orderId) throws Exception {

        orderRepository.deleteById(orderId);

    }

    @Override
    public List<Order> getUserOrder(Long userId) throws Exception {

        // ensure items are fetched with orders to avoid missing items due to lazy loading
        return orderRepository.findByCustomerIdWithItems(userId);
    }

    @Override
    public List<Order> getRestaurantOrders(Long restaurantId, String orderStatus) throws Exception {
        // fetch orders with items to ensure items are returned in API
        List<Order> orders=orderRepository.findByRestaurantIdWithItems(restaurantId);
        if (orderStatus!=null){
            orders=orders.stream().filter(order -> order.getOrderStatus().equals(orderStatus)).collect(Collectors.toList());
        }
        return orders;

    }

    @Override
    public Order findOrderById(Long orderId) throws Exception {
        return orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new Exception("order not found"));
    }
}
