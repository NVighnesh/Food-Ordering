package com.vighnesh.service;

import com.vighnesh.dto.RestaurantDto;
import com.vighnesh.model.Restaurant;
import com.vighnesh.model.User;
import com.vighnesh.request.CreateRestaurantRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface RestaurantService {
    public Restaurant createRestaurant(CreateRestaurantRequest req, User user);


    public Restaurant updateRestaurant(Long restaurantId,CreateRestaurantRequest updateRestaurant) throws Exception;

    public void deleteRestaurant(Long restaurantId) throws Exception;

    public List<Restaurant> getAllRestaurant();

    public Page<Restaurant> searchRestaurant(String keyword, Pageable pageable);

    public Restaurant findRestaurantById(Long id) throws Exception;

    public List<Restaurant> getRestaurantByUserId(Long userId) throws Exception;

    public RestaurantDto addToFavorites(Long restaurantId,User user) throws Exception;

    public Restaurant updateRestaurantStatus(Long id)throws Exception;

    public List<RestaurantDto> getFavoriteRestaurants(User user);
}
