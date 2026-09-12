package com.vighnesh.dto;

import lombok.Data;

import java.util.List;

@Data
public class FoodDto {
    private Long id;
    private String name;
    private String description;
    private Long price;
    private List<String> images;
    private boolean vegetarian;
    private boolean seasonal;
    private CategoryDto category;
    private Long restaurantId;
}

