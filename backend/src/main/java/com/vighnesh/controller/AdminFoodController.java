package com.vighnesh.controller;


import com.vighnesh.model.Food;
import com.vighnesh.model.Restaurant;
import com.vighnesh.request.BulkUpdateFoodCategoryRequest;
import com.vighnesh.request.CreateFoodRequest;
import com.vighnesh.response.MessageResponse;
import com.vighnesh.service.FoodService;
import com.vighnesh.service.RestaurantService;
import com.vighnesh.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/food")
public class AdminFoodController {

    @Autowired
    private FoodService foodService;

    @Autowired
    private UserService userService;

    @Autowired
    private RestaurantService restaurantService;

    @PostMapping("")
    public ResponseEntity<Food> createFood(@RequestBody CreateFoodRequest req,
                                           @RequestHeader("Authorization")String jwt) throws Exception {
        userService.findUserByJwtToken(jwt);
        Restaurant restaurant=restaurantService.findRestaurantById(req.getRestaurantId());
        Food food=foodService.createFood(req, restaurant);

        return new ResponseEntity<>(food, HttpStatus.CREATED);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteFood(@PathVariable Long id,
                                                      @RequestHeader("Authorization")String jwt) throws Exception {
        userService.findUserByJwtToken(jwt);
        foodService.deleteFood(id);
        MessageResponse res=new MessageResponse();
        res.setMessage("food deleted successfully");


        return new ResponseEntity<>(res, HttpStatus.OK);
    }
    @PutMapping("/{id}")
    public ResponseEntity<Food> updateFoodAvailibilityStatus(@PathVariable Long id,
                                                      @RequestHeader("Authorization")String jwt) throws Exception {
        userService.findUserByJwtToken(jwt);
        Food food=foodService.updateAvailibilityStatus(id);



        return new ResponseEntity<>(food, HttpStatus.OK);
    }

    @PatchMapping("/{id}/category")
    public ResponseEntity<Food> updateFoodCategory(@PathVariable("id") Long foodId,
                                                   @RequestParam("categoryId") Long categoryId,
                                                   @RequestHeader("Authorization") String jwt) throws Exception {
        userService.findUserByJwtToken(jwt);
        Food food = foodService.updateFoodCategory(foodId, categoryId);
        return new ResponseEntity<>(food, HttpStatus.OK);
    }

    @PatchMapping("/category/bulk")
    public ResponseEntity<List<Food>> bulkUpdateFoodCategory(@RequestBody BulkUpdateFoodCategoryRequest req,
                                                             @RequestHeader("Authorization") String jwt) throws Exception {
        userService.findUserByJwtToken(jwt);
        List<Food> updated = foodService.bulkUpdateFoodCategory(req.getUpdates());
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }
}
