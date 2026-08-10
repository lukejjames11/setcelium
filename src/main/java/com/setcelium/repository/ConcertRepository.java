package com.setcelium.repository;

import com.setcelium.model.Concert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ConcertRepository extends JpaRepository<Concert, UUID> {
    boolean existsByOrderNumber(String orderNumber);
}
