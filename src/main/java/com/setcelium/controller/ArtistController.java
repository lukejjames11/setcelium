package com.setcelium.controller;

import com.setcelium.dto.CreateArtistRequest;
import com.setcelium.model.Artist;
import com.setcelium.service.ArtistService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/artists")
public class ArtistController {

    private final ArtistService artistService;

    public ArtistController(ArtistService artistService) {
        this.artistService = artistService;
    }

    @GetMapping
    public List<Artist> getAll() {
        // TODO: delegate
        return artistService.getAllArtists();
    }

    @GetMapping("/{id}")
    public Artist getById(@PathVariable UUID id) {
        // TODO: delegate
        return artistService.getArtistById(id);
    }

@PostMapping
public Artist create(@RequestBody CreateArtistRequest request) {
    return artistService.createArtist(request.name());
}

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        // TODO: delegate

        artistService.deleteArtist(id);

    }
}