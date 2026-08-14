package com.setcelium.controller;

import com.setcelium.dto.CreateConcertRequest;
import com.setcelium.model.Concert;
import com.setcelium.service.ConcertService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/concerts")
public class ConcertController {

    private final ConcertService concertService;

    public ConcertController(ConcertService concertService) {
        this.concertService = concertService;
    }

    /**
     * GET /api/concerts — list every concert.
     */
    @GetMapping
    public List<Concert> getAll() {
        // TODO: one line, just delegate to the service
        return concertService.getAllConcerts();
    }

    /**
     * GET /api/concerts/{id} — fetch a single concert.
     */
    @GetMapping("/{id}")
    public Concert getById(@PathVariable UUID id) {
        // TODO: delegate to the service
        return concertService.getConcertById(id);
    }

    /**
     * POST /api/concerts — create a new concert from a manual entry.
     */
    @PostMapping
    public Concert create(@RequestBody CreateConcertRequest request) {
        // TODO: delegate to the service
        return concertService.createConcert(request);
    }

    /**
     * PUT /api/concerts/{id} — update an existing concert.
     */
    @PutMapping("/{id}")
    public Concert update(@PathVariable UUID id, @RequestBody CreateConcertRequest request) {
        // TODO: delegate to the service
        return concertService.updateConcert(id, request);
    }

    /**
     * DELETE /api/concerts/{id} — delete a concert.
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        // TODO: delegate to the service
        concertService.deleteConcert(id);
    }
}