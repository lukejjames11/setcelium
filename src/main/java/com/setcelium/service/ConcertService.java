package com.setcelium.service;

import com.setcelium.dto.CreateConcertRequest;
import com.setcelium.model.Concert;
import com.setcelium.repository.ConcertRepository;

import org.springframework.stereotype.Service;

import com.setcelium.exception.ConcertNotFoundException;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

@Service
public class ConcertService {

    private final ConcertRepository concertRepository;

    public ConcertService(ConcertRepository concertRepository) {
        this.concertRepository = concertRepository;
    }

    /**
     * Returns every concert in the database.
     */
    public List<Concert> getAllConcerts() {
        // TODO: ConcertRepository already has a method for "get everything"
        // (inherited from JpaRepository) — no query method needed
        return concertRepository.findAll();
    }

    /**
     * Returns a single concert by id, or throws if not found.
     */
    public Concert getConcertById(UUID id) {
        // TODO: findById returns Optional<Concert> — unwrap it.
        // If empty, throw an exception (think about what kind —
        // this matters for how the controller/HTTP response should behave)
        
        Optional<Concert> result = concertRepository.findById(id);

        if (result.isPresent()) {
            return result.get();
        }
        else {
            throw new ConcertNotFoundException("Concert not found: " + id);
        }
    }

    /**
     * Creates a new concert from a manual entry request.
     */
    public Concert createConcert(CreateConcertRequest request) {
        // TODO: map request fields into a new Concert.
        // What should source be? What should needsReview be,
        // for something a human typed in themselves?
        // What about orderNumber, which manual entries don't have?

        Concert newConcert = new Concert(request.artist(), request.venue(), request.showDate(), request.city(), request.state(), "manual_entry", null, false);

        return concertRepository.save(newConcert);
    }

    /**
     * Updates an existing concert's fields and saves it.
     */
    public Concert updateConcert(UUID id, CreateConcertRequest request) {
        // TODO: fetch the existing concert first (reuse getConcertById?),
        // then use its setters to apply the new field values,
        // then save it. Do NOT construct a brand new Concert —
        // you'd lose the original id.

        Concert concert = getConcertById(id);

        concert.setArtist(request.artist());
        concert.setCity(request.city());
        concert.setState(request.state());
        concert.setVenue(request.venue());
        concert.setShowDate(request.showDate());

        return concertRepository.save(concert);

    }

    /**
     * Deletes a concert by id.
     */
    public void deleteConcert(UUID id) {
        // TODO: ConcertRepository has a method for this too, inherited
        // from JpaRepository. Consider: should this throw if the id
        // doesn't exist, or silently do nothing?

        if (!concertRepository.existsById(id)) {
            throw new ConcertNotFoundException("Concert not found");
        }

        concertRepository.deleteById(id);

        return;
    }
}
