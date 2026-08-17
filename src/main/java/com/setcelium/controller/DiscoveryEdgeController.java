package com.setcelium.controller;

import com.setcelium.dto.CreateDiscoveryEdgeRequest;
import com.setcelium.model.DiscoveryEdge;
import com.setcelium.service.DiscoveryEdgeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/discovery-edges")
public class DiscoveryEdgeController {

    private final DiscoveryEdgeService discoveryEdgeService;

    public DiscoveryEdgeController(DiscoveryEdgeService discoveryEdgeService) {
        this.discoveryEdgeService = discoveryEdgeService;
    }

    @GetMapping
    public List<DiscoveryEdge> getAll() {
        // TODO: delegate
        return discoveryEdgeService.getAllEdges();
    }

    @GetMapping("/{id}")
    public DiscoveryEdge getById(@PathVariable UUID id) {
        // TODO: delegate
        return discoveryEdgeService.getEdgeById(id);
    }

    @PostMapping
    public DiscoveryEdge create(@RequestBody CreateDiscoveryEdgeRequest request) {
        // TODO: delegate
        return discoveryEdgeService.createEdge(request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        // TODO: delegate

        discoveryEdgeService.deleteEdge(id);

    }
}