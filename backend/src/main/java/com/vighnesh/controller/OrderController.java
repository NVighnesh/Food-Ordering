package com.vighnesh.controller;

import com.vighnesh.model.Order;
import com.vighnesh.model.User;
import com.vighnesh.request.OrderRequest;
import com.vighnesh.response.PaymentResponse;
import com.vighnesh.service.OrderService;
import com.vighnesh.service.PaymentService;
import com.vighnesh.service.UserService;
import com.stripe.exception.StripeException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private PaymentService paymentService;


    @Autowired
    private UserService userService;
    @PostMapping("/order")
    public ResponseEntity<?> createOrder(@RequestBody OrderRequest req, @RequestHeader("Authorization") String jwt)throws Exception{
        try {
            User user=userService.findUserByJwtToken(jwt);
            Order order=orderService.createOrder(req,user);
            PaymentResponse res=paymentService.createPaymentLink(order);
            return new ResponseEntity<>(res, HttpStatus.OK);
        } catch (IllegalArgumentException ex) {
            // validation errors (e.g. zero amount)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        } catch (StripeException ex) {
            // Stripe API errors
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("Payment provider error: " + ex.getMessage());
        }
    }
    @GetMapping("/order/user")
    public ResponseEntity<List<Order>> getOrderHistory(@RequestHeader("Authorization") String jwt)throws Exception{
        User user=userService.findUserByJwtToken(jwt);
        List<Order> orders=orderService.getUserOrder(user.getId());
        return new ResponseEntity<>(orders, HttpStatus.OK);
    }

    @GetMapping("/order/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable("id") Long id, @RequestHeader("Authorization") String jwt) throws Exception {
        // Optionally, validate the order belongs to the requesting user
        Order order = orderService.findOrderById(id);
        return new ResponseEntity<>(order, HttpStatus.OK);
    }

}
