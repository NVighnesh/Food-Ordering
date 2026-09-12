package com.vighnesh.repository;

import com.vighnesh.model.Restaurant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RestaurantRepository  extends JpaRepository<Restaurant,Long> {
    @Query("SELECT r FROM Restaurant r WHERE lower(r.name) LIKE lower(concat('%',:query,'%')) OR lower(r.cuisineType) LIKE lower(concat('%',:query,'%') )")
    Page<Restaurant> findBySearchQuery(@Param("query") String searchQuery, Pageable pageable);

    @Query("SELECT r FROM Restaurant r WHERE lower(r.name) LIKE lower(concat('%',:query,'%')) OR lower(r.cuisineType) LIKE lower(concat('%',:query,'%') )")
    List<Restaurant> findBySearchQuery(@Param("query") String searchQuery);

    List<Restaurant> findByOwnerId(Long userId);

    Restaurant findByName(String name);

}
