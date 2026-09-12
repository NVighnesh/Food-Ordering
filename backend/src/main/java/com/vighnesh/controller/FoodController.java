package com.vighnesh.controller;


import com.vighnesh.dto.CategoryDto;
import com.vighnesh.dto.FoodDto;
import com.vighnesh.model.Food;
import com.vighnesh.service.FoodService;
import com.vighnesh.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/food")
public class FoodController {
    @Autowired
    private FoodService foodService;

    @Autowired
    private UserService userService;

    @GetMapping("/search")
    public ResponseEntity<Page<FoodDto>> searchFood(@RequestParam String name,
                                                 @RequestHeader("Authorization")String jwt,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "10") int size) throws Exception {
        userService.findUserByJwtToken(jwt);

        Page<Food> foods=foodService.searchFood(name, PageRequest.of(page, size));
        Page<FoodDto> dtoPage = foods.map(f -> {
            FoodDto dto = new FoodDto();
            dto.setId(f.getId());
            dto.setName(f.getName());
            dto.setDescription(f.getDescription());
            dto.setPrice(f.getPrice());
            dto.setImages(f.getImages());
            dto.setVegetarian(f.isVegetarian());
            dto.setSeasonal(f.isSeasonal());
            if (f.getFoodCategory()!=null){
                CategoryDto c = new CategoryDto();
                c.setId(f.getFoodCategory().getId());
                c.setName(f.getFoodCategory().getName());
                dto.setCategory(c);
            }
            if (f.getRestaurant()!=null) dto.setRestaurantId(f.getRestaurant().getId());
            return dto;
        });

        return new ResponseEntity<>(dtoPage, HttpStatus.OK);
    }
    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<Food>> getRestaurantFood(@RequestParam (required = false) boolean Vegetarian,
                                                        @RequestParam (required = false) boolean Nonveg,
                                                        @RequestParam (required = false) boolean Seasonal,
                                                        @RequestParam(required = false, name = "food_Category") String food_Category,
                                                        @RequestParam(required = false, name = "categoryId") Long categoryId,
                                                        @PathVariable Long restaurantId,
                                                 @RequestHeader("Authorization")String jwt) throws Exception {
        userService.findUserByJwtToken(jwt);

        List<Food> foods=foodService.getRestaurantFood(restaurantId,Vegetarian,Nonveg,Seasonal,food_Category, categoryId);

        return new ResponseEntity<>(foods, HttpStatus.OK);
    }

}
