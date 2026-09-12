package com.vighnesh.service;

import com.vighnesh.model.Category;
import com.vighnesh.model.Food;
import com.vighnesh.model.Restaurant;
import com.vighnesh.repository.CategoryRepository;
import com.vighnesh.repository.FoodRepository;
import com.vighnesh.request.CreateFoodRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class FoodServiceImp implements FoodService{

    @Autowired
    private FoodRepository foodRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Override
    public Food createFood(CreateFoodRequest req, Restaurant restaurant) {
        // Resolve category via categoryId or nested category.id
        Long resolvedCatId = req.getCategoryId() != null
                ? req.getCategoryId()
                : (req.getCategory() != null ? req.getCategory().getId() : null);
        if (resolvedCatId == null) {
            throw new RuntimeException("Category is required");
        }
        Optional<Category> categoryOpt = categoryRepository.findById(resolvedCatId);
        if (categoryOpt.isEmpty()) {
            throw new RuntimeException("Category not found: " + resolvedCatId);
        }
        Category category = categoryOpt.get();
        if (category.getRestaurant() == null || !Objects.equals(category.getRestaurant().getId(), restaurant.getId())) {
            throw new RuntimeException("Category does not belong to the specified restaurant");
        }

        Food food=new Food();
        food.setFoodCategory(category);
        food.setRestaurant(restaurant);
        food.setDescription(req.getDescription());
        food.setName(req.getName());
        food.setImages(req.getImages());
        food.setPrice(req.getPrice());
        food.setVegetarian(req.isVegetarian());
        food.setCreationDate(new Date());
        food.setSeasonal(req.isSeasional());
        food.setIngredients(req.getIngredients());
        Food savedFood=foodRepository.save(food);
        restaurant.getFoods().add(savedFood);
        return savedFood;
    }

    @Override
    public void deleteFood(Long foodId) throws Exception {
        Food food=findFoodById(foodId);
        food.setRestaurant(null);
        foodRepository.save(food);

    }

    @Override
    public List<Food> getRestaurantFood(Long restaurantId, boolean isVegetarian, boolean isNonveg, boolean isSeasonal, String foodCategoryName, Long categoryId) {

        List<Food> foods=foodRepository.findByRestaurantId(restaurantId);
        if(isVegetarian)
        {
            foods=filterByVegetarian(foods,isVegetarian);

        }
        if(isNonveg){
            foods=filterByNonveg(foods);
        }
        if(isSeasonal){
            foods=filterBySeasonal(foods,isSeasonal);

        }
        if(categoryId!=null){
            foods=filterByCategoryId(foods,categoryId);
        } else if(foodCategoryName!=null){
            foods=filterByCategoryName(foods,foodCategoryName);
        }

        return foods;
    }

    private List<Food> filterByCategoryName(List<Food> foods, String foodCategory) {
        return foods.stream().filter(food -> {
            if (food.getFoodCategory()!=null){
                return food.getFoodCategory().getName().equals(foodCategory);
            }else{
                return false;
            }

        }).collect(Collectors.toList());
    }

    private List<Food> filterByCategoryId(List<Food> foods, Long categoryId) {
        return foods.stream().filter(food -> food.getFoodCategory()!=null && Objects.equals(food.getFoodCategory().getId(), categoryId))
                .collect(Collectors.toList());
    }

    private List<Food> filterByNonveg(List<Food> foods) {
        return foods.stream().filter(food -> !food.isVegetarian()).collect(Collectors.toList());
    }

    private List<Food> filterBySeasonal(List<Food> foods, boolean isSeasonal) {
        return foods.stream().filter(food -> food.isSeasonal()==isSeasonal).collect(Collectors.toList());
    }



    private List<Food> filterByVegetarian(List<Food> foods, boolean isVegetarian) {

        return foods.stream().filter(food -> food.isVegetarian()==isVegetarian).collect(Collectors.toList());
    }

    @Override
    public Page<Food> searchFood(String keyword, Pageable pageable) {
        return foodRepository.searchFood(keyword, pageable);
    }

    @Override
    public Food findFoodById(Long foodId) throws Exception {
        Optional<Food> optionalFood=foodRepository.findById(foodId);
        if (optionalFood.isEmpty()){
            throw new Exception("food not found");
        }
        return optionalFood.get();
    }

    @Override
    public Food updateAvailibilityStatus(Long foodId) throws Exception {
        Food food=findFoodById(foodId);
        food.setAvailable(!food.isAvailable());
        return foodRepository.save(food);

    }

    @Override
    public Food updateFoodCategory(Long foodId, Long categoryId) throws Exception {
        Food food = findFoodById(foodId);
        if (categoryId == null) {
            throw new RuntimeException("categoryId is required");
        }
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found: " + categoryId));
        if (food.getRestaurant() == null || category.getRestaurant() == null ||
                !Objects.equals(food.getRestaurant().getId(), category.getRestaurant().getId())) {
            throw new RuntimeException("Category does not belong to the same restaurant as the food");
        }
        food.setFoodCategory(category);
        return foodRepository.save(food);
    }

    @Override
    public List<Food> bulkUpdateFoodCategory(java.util.Map<Long, Long> updates) throws Exception {
        java.util.List<Food> result = new java.util.ArrayList<>();
        if (updates == null || updates.isEmpty()) return result;
        for (java.util.Map.Entry<Long, Long> e : updates.entrySet()) {
            Long foodId = e.getKey();
            Long categoryId = e.getValue();
            Food updated = updateFoodCategory(foodId, categoryId);
            result.add(updated);
        }
        return result;
    }
}
