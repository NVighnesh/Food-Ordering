package com.vighnesh.controller;

import com.vighnesh.dto.RestaurantDto;
import com.vighnesh.model.Restaurant;
import com.vighnesh.model.User;
import com.vighnesh.service.RestaurantService;
import com.vighnesh.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {
    @Autowired
    private RestaurantService restaurantService;

    @Autowired
    private UserService userService;

    @GetMapping("/search")
    public ResponseEntity<Page<RestaurantDto>> searchRestaurant(

            @RequestHeader("Authorization") String jwt,
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        Page<Restaurant> restaurantPage = restaurantService.searchRestaurant(keyword, PageRequest.of(page, size));
        Page<RestaurantDto> dtoPage = restaurantPage.map(r -> {
            RestaurantDto dto = new RestaurantDto();
            dto.setId(r.getId());
            dto.setTitle(r.getName());
            dto.setImages(r.getImages());
            dto.setDescription(r.getDescription());
            return dto;
        });
        return new ResponseEntity<>(dtoPage, HttpStatus.OK);
    }
    @GetMapping("")
    public ResponseEntity<List<Restaurant>> getAllRestaurant(

            @RequestHeader("Authorization") String jwt
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        List<Restaurant> restaurant = restaurantService.getAllRestaurant();
        return new ResponseEntity<>(restaurant, HttpStatus.OK);
    }
    @GetMapping("/{id}")
    public ResponseEntity<Restaurant> findRestaurantById(

            @RequestHeader("Authorization") String jwt,
            @PathVariable Long id
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
       Restaurant restaurant = restaurantService.findRestaurantById(id);
        return new ResponseEntity<>(restaurant, HttpStatus.OK);
    }
    @PutMapping("/{id}/add-favorites")
    public ResponseEntity<RestaurantDto> addToFavorites(

            @RequestHeader("Authorization") String jwt,
            @PathVariable Long id
    ) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        RestaurantDto restaurant = restaurantService.addToFavorites(id,user);

        return new ResponseEntity<>(restaurant, HttpStatus.OK);
    }
    @GetMapping("/favorites")
    public ResponseEntity<List<RestaurantDto>> getFavorites(@RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.findUserByJwtToken(jwt);
        List<RestaurantDto> favorites = restaurantService.getFavoriteRestaurants(user);
        return new ResponseEntity<>(favorites, HttpStatus.OK);
    }
}
