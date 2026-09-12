package com.vighnesh.request;

import lombok.Data;

@Data
public class IngredientRequest {
    private String name;
    private Long restaurantId;
    private Long categoryId;

    // Getters and setters

}
