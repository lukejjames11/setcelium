package com.setcelium.service;

import com.setcelium.dto.CreateDiscoveryEdgeRequest;
import com.setcelium.exception.DiscoveryEdgeNotFoundException;
import com.setcelium.model.Artist;
import com.setcelium.model.DiscoveryEdge;
import com.setcelium.repository.DiscoveryEdgeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class DiscoveryEdgeService {

    private final DiscoveryEdgeRepository discoveryEdgeRepository;
    private final ArtistService artistService;

    public DiscoveryEdgeService(DiscoveryEdgeRepository discoveryEdgeRepository, ArtistService artistService) {
        this.discoveryEdgeRepository = discoveryEdgeRepository;
        this.artistService = artistService;
    }

    public List<DiscoveryEdge> getAllEdges() {
        // TODO: one-liner, same as before
        return discoveryEdgeRepository.findAll();
    }

    public DiscoveryEdge getEdgeById(UUID id) {
        // TODO: same .orElseThrow() pattern, using DiscoveryEdgeNotFoundException
        Optional<DiscoveryEdge> result = discoveryEdgeRepository.findById(id);

        if (result.isPresent()) {
            return result.get();
        }
        else {
            throw new DiscoveryEdgeNotFoundException("Discovery Edge not found: " + id);
        }
    }

    public DiscoveryEdge createEdge(CreateDiscoveryEdgeRequest request) {
        // TODO: this is the new, interesting logic. Steps:
        // 1. If request.fromArtistName() is not null, call
        //    artistService.findOrCreateArtist(...) to get/create the
        //    "from" artist. If it IS null, fromArtist should just be null
        //    (no prior artist thread — a valid case per our design).
        // 2. toArtistName should never be null (every edge needs a
        //    destination) — call findOrCreateArtist for it unconditionally.
        // 3. Construct a new DiscoveryEdge using the two Artist objects
        //    (not the names) plus connectorName, edgeType, notes from
        //    the request.
        // 4. Save it, return the result.

        Artist fromArtist = null;

        if (request.fromArtistName() != null) {
            fromArtist = artistService.findOrCreateArtist(request.fromArtistName());
        }

        Artist toArtist = artistService.findOrCreateArtist(request.toArtistName());

        DiscoveryEdge newEdge = new DiscoveryEdge();

        newEdge.setFromArtist(fromArtist);
        newEdge.setToArtist(toArtist);  
        newEdge.setConnectorName(request.connectorName());
        newEdge.setEdgeType(request.edgeType());
        newEdge.setNotes(request.notes());

        return discoveryEdgeRepository.save(newEdge);
        
    }

    public void deleteEdge(UUID id) {
        // TODO: same existsById-check-then-delete pattern
        
        if (!discoveryEdgeRepository.existsById(id)) {
            throw new DiscoveryEdgeNotFoundException("Discovery Edge not found");
        }

        discoveryEdgeRepository.deleteById(id);

        return;
    }
}