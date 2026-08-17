package com.setcelium.repository;

import com.setcelium.model.Artist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
import java.util.Optional;

public interface ArtistRepository extends JpaRepository<Artist, UUID> {
    // TODO: any custom finder methods you think you'll need.
    // Consider: will you ever need to look up an Artist by name,
    // e.g. to check "does an artist with this name already exist"
    // before creating a duplicate?

    Optional<Artist> findByName(String name);

}