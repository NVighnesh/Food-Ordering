package com.vighnesh.model;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartItem {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @JsonIgnore
    @ManyToOne
    private Cart cart;

    @ManyToOne
    private Food food;

    private int quantity;

    @ElementCollection
    private List<String> ingredients;

    private Long totalPrice;

    // Expose name/images at the cart item level for convenience in API responses
    @Transient
    public String getName() {
        return food != null ? food.getName() : null;
    }

    @Transient
    public List<String> getImages() {
        return food != null ? food.getImages() : null;
    }

    @Transient
    public Long getPrice() {
        return food != null ? food.getPrice() : null;
    }
}
