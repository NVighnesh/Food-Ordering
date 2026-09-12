package com.vighnesh.repository;

import com.vighnesh.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderitemRepository extends JpaRepository<OrderItem,Long> {
}
