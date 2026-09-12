package com.vighnesh.repository;

import com.vighnesh.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order,Long> {
    public List<Order>findByCustomerId(Long userId);
    // fetch orders together with their items and item.food to ensure items are returned in API
    @Query("select distinct o from Order o left join fetch o.items oi left join fetch oi.food where o.customer.id = :userId")
    public List<Order> findByCustomerIdWithItems(@Param("userId") Long userId);
    // fetch orders for a restaurant with items and each item's food
    @Query("select distinct o from Order o left join fetch o.items oi left join fetch oi.food where o.restaurant.id = :restaurantId")
    public List<Order> findByRestaurantIdWithItems(@Param("restaurantId") Long restaurantId);
    public List<Order>findByRestaurantId(Long restaurantId);
    boolean existsByDeliveryAddressId(Long deliveryAddressId);

    // fetch a single order by id with items and their foods
    @Query("select o from Order o left join fetch o.items oi left join fetch oi.food where o.id = :orderId")
    Optional<Order> findByIdWithItems(@Param("orderId") Long orderId);
}
