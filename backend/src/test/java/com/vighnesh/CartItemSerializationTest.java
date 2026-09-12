package com.vighnesh;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vighnesh.model.Cart;
import com.vighnesh.model.CartItem;
import com.vighnesh.model.Food;
import org.junit.jupiter.api.Test;

import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

public class CartItemSerializationTest {

    @Test
    void cartItem_contains_name_and_images_in_serialized_json() throws Exception {
        // Arrange
        Food food = new Food();
        food.setId(1L);
        food.setName("Margherita Pizza");
        food.setPrice(499L);
        food.setImages(Arrays.asList("/img/pizza1.jpg", "/img/pizza2.jpg"));

        CartItem item = new CartItem();
        item.setId(10L);
        item.setFood(food);
        item.setQuantity(2);
        item.setTotalPrice(998L);

        Cart cart = new Cart();
        cart.setId(100L);
        cart.setTotal(998L);
        cart.getItems().add(item);

        ObjectMapper mapper = new ObjectMapper();

        // Act
        String json = mapper.writeValueAsString(cart);
        JsonNode root = mapper.readTree(json);
        JsonNode firstItem = root.get("items").get(0);

        // Assert
        assertEquals("Margherita Pizza", firstItem.get("name").asText());
        assertEquals(2, firstItem.get("images").size());
        assertEquals("/img/pizza1.jpg", firstItem.get("images").get(0).asText());
        // original nested food object still present
        assertEquals("Margherita Pizza", firstItem.get("food").get("name").asText());
        assertEquals(499, firstItem.get("price").asLong());
    }
}

