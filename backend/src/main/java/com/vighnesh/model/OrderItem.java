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
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @ManyToOne
    private Food food;

    private int quantity;

    private Long totalPrice;

    @ElementCollection
    private List<String> ingredients;

    @JsonIgnore
    @ManyToOne
    private Order order;

    // Convenience fields for API consumers
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
