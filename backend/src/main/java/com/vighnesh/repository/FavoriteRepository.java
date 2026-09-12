package com.vighnesh.repository;

import com.vighnesh.model.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    Optional<Favorite> findByUser_IdAndRestaurantId(Long userId, Long restaurantId);
    void deleteByUser_IdAndRestaurantId(Long userId, Long restaurantId);
    List<Favorite> findByUser_Id(Long userId);
}
