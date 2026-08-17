package com.setcelium.service;

import com.setcelium.exception.ArtistNotFoundException;
import com.setcelium.model.Artist;
import com.setcelium.repository.ArtistRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

@Service
public class ArtistService {

    private final ArtistRepository artistRepository;

    public ArtistService(ArtistRepository artistRepository) {
        this.artistRepository = artistRepository;
    }

    public List<Artist> getAllArtists() {
        // TODO: same one-liner as ConcertService.getAllConcerts
        return artistRepository.findAll();
    }

    public Artist getArtistById(UUID id) {
        // TODO: same .orElseThrow() pattern as ConcertService.getConcertById,
        // using ArtistNotFoundException instead
        
        Optional<Artist> result = artistRepository.findById(id);

        if (result.isPresent()) {
            return result.get();
        }
        else {
            throw new ArtistNotFoundException("Artist not found: " + id);
        }
    }

    public Artist createArtist(String name) {
        // TODO: construct a new Artist, save it, return the saved result
        // (remember: save() returns the object WITH its generated id —
        // this bit you now know from experience with Concert)

        Artist newArtist = new Artist(name);

        return artistRepository.save(newArtist);

    }

    public void deleteArtist(UUID id) {
        // TODO: same existsById-check-then-delete pattern as
        // ConcertService.deleteConcert, using ArtistNotFoundException
        if (!artistRepository.existsById(id)) {
            throw new ArtistNotFoundException("Artist not found");
        }

        artistRepository.deleteById(id);

        return;
    }

    /**
     * Finds an existing artist by name, or creates a new one if none
     * exists. This is the method DiscoveryEdgeService will lean on
     * when creating an edge, so a duplicate "The White Stripes" never
     * gets created just because someone typed the name again.
     */
    public Artist findOrCreateArtist(String name) {
        // TODO: use artistRepository.findByName(name) — it returns
        // an Optional<Artist>. If present, return it. If empty,
        // call createArtist(name) instead.
        
        Optional<Artist> artist = artistRepository.findByName(name);

        if (artist.isPresent()) {
            return artist.get();
        }
        else {
            return createArtist(name);
        }
    }
}