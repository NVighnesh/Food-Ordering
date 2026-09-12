package com.vighnesh.request;

import lombok.Data;

import java.util.Map;

@Data
public class BulkUpdateFoodCategoryRequest {
    // Map of foodId -> categoryId
    private Map<Long, Long> updates;
}

