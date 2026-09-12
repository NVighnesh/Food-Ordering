package com.vighnesh.controller;

import com.vighnesh.model.Restaurant;
import com.vighnesh.model.User;
import com.vighnesh.request.CreateRestaurantRequest;
import com.vighnesh.response.MessageResponse;
import com.vighnesh.service.RestaurantService;
import com.vighnesh.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/restaurants")
public class AdminRestaurantController {

    @Autowired
    private RestaurantService restaurantService;

    @Autowired
    private UserService userService;

    @PostMapping()
    public ResponseEntity<Restaurant> createRestaurant(
            @RequestBody CreateRestaurantRequest req,
            @RequestHeader("Authorization")String jwt
    ) throws Exception{
        User user=userService.findUserByJwtToken(jwt);
        Restaurant restaurant=restaurantService.createRestaurant(req,user);
        return new ResponseEntity<>(restaurant, HttpStatus.CREATED);
    }
    @PutMapping("/{id}")
    public ResponseEntity<Restaurant> updateRestaurant(
            @RequestBody CreateRestaurantRequest req,
            @RequestHeader("Authorization")String jwt,
            @PathVariable Long id
    ) throws Exception{
        User user=userService.findUserByJwtToken(jwt);
        Restaurant restaurant=restaurantService.updateRestaurant(id,req);
        return new ResponseEntity<>(restaurant, HttpStatus.CREATED);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteRestaurant(

            @RequestHeader("Authorization")String jwt,
            @PathVariable Long id
    ) throws Exception{
        User user=userService.findUserByJwtToken(jwt);
        restaurantService.deleteRestaurant(id);
        MessageResponse res=new MessageResponse();
        res.setMessage("restaurant deleted");
        return new ResponseEntity<>(res, HttpStatus.OK);
    }
    @PutMapping("/{id}/status")
    public ResponseEntity<Restaurant> updateRestaurantStatus(

            @RequestHeader("Authorization")String jwt,
            @PathVariable Long id
    ) throws Exception{
        User user=userService.findUserByJwtToken(jwt);
        Restaurant restaurant=restaurantService.updateRestaurantStatus(id);

        return new ResponseEntity<>(restaurant, HttpStatus.OK);
    }
    @GetMapping("/user")
    public ResponseEntity<List<Restaurant>> findRestaurantByUserId(

            @RequestHeader("Authorization")String jwt

    ) throws Exception{
        User user=userService.findUserByJwtToken(jwt);
        List<Restaurant> restaurants=restaurantService.getRestaurantByUserId(user.getId());

        return new ResponseEntity<>(restaurants, HttpStatus.OK);
    }
}
