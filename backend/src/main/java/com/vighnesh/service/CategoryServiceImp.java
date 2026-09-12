package com.vighnesh.service;

import com.vighnesh.model.Category;
import com.vighnesh.model.Restaurant;
import com.vighnesh.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryServiceImp implements CategoryService{

    @Autowired
    private RestaurantService restaurantService;

    @Autowired
    private CategoryRepository categoryRepository;
    @Override
    public Category createCategory(String name, Long userId) throws Exception {
        List<Restaurant> restaurants = restaurantService.getRestaurantByUserId(userId);
        if (restaurants == null || restaurants.isEmpty()) {
            throw new Exception("No restaurant found for user id: " + userId);
        }
        Restaurant restaurant = restaurants.get(0); // Use the first restaurant
        Category category = new Category();
        category.setName(name);
        category.setRestaurant(restaurant);


        return categoryRepository.save(category);
    }

    @Override
    public List<Category> findCategoryByRestaurantId(Long id) throws Exception {
        Restaurant restaurant=restaurantService.findRestaurantById(id);



        return categoryRepository.findByRestaurantId(id);
    }

    @Override
    public Category findCategoryById(Long id) throws Exception {
        Optional<Category> optionalCategory=categoryRepository.findById(id);
        if(optionalCategory.isEmpty()){
            throw new Exception("category not found");

        }
        return optionalCategory.get();
    }
}
