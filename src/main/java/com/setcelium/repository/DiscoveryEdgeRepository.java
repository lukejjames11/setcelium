package com.setcelium.repository;

import com.setcelium.model.DiscoveryEdge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DiscoveryEdgeRepository extends JpaRepository<DiscoveryEdge, UUID> {
    List<DiscoveryEdge> findByFromArtistId(UUID artistId);
    List<DiscoveryEdge> findByToArtistId(UUID artistId);
}