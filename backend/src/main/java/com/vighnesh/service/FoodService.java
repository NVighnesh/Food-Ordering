package com.vighnesh.service;

import com.vighnesh.model.Food;
import com.vighnesh.model.Restaurant;
import com.vighnesh.request.CreateFoodRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface FoodService {

    Food createFood(CreateFoodRequest req, Restaurant restaurant);
    void deleteFood(Long foodId) throws Exception;

    List<Food> getRestaurantFood(Long restaurantId, boolean isVegetarian, boolean isNonveg, boolean isSeasonal, String foodCategoryName, Long categoryId);
    Page<Food> searchFood(String keyword, Pageable pageable);
    Food findFoodById(Long id) throws Exception;
    Food updateAvailibilityStatus(Long foodId) throws Exception;
    Food updateFoodCategory(Long foodId, Long categoryId) throws Exception;

    // New: bulk repair/update categories
    List<Food> bulkUpdateFoodCategory(Map<Long, Long> updates) throws Exception;
}
