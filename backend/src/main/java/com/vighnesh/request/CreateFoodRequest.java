package com.vighnesh.request;

import com.vighnesh.model.Category;
import com.vighnesh.model.IngredientsItem;
import lombok.Data;

import java.util.List;

@Data
public class CreateFoodRequest {
    private String name;
    private String description;
    private Long price;
    private Category category;
    private Long categoryId; // New: accept categoryId for robust backend mapping
    private List<String> images;
    private Long restaurantId;
    private boolean vegetarian;
    private boolean seasional;
    private List<IngredientsItem> ingredients;

}
