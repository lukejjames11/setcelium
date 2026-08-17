package com.setcelium.service;

import com.setcelium.dto.GraphLink;
import com.setcelium.dto.GraphNode;
import com.setcelium.dto.GraphResponse;
import com.setcelium.model.Artist;
import com.setcelium.model.DiscoveryEdge;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.ArrayList;

@Service
public class GraphService {

    private final ArtistService artistService;
    private final DiscoveryEdgeService discoveryEdgeService;

    public GraphService(ArtistService artistService, DiscoveryEdgeService discoveryEdgeService) {
        this.artistService = artistService;
        this.discoveryEdgeService = discoveryEdgeService;
    }

    public GraphResponse buildGraph() {
        // TODO:
        // 1. Get all artists via artistService.getAllArtists()
        // 2. Map each Artist -> a GraphNode (id, name)
        // 3. Get all edges via discoveryEdgeService.getAllEdges()
        // 4. Filter out any edge where getFromArtist() is null
        // 5. Map each remaining DiscoveryEdge -> a GraphLink
        //    (source = fromArtist's id, target = toArtist's id,
        //    plus connectorName, edgeType, notes)
        // 6. Return a new GraphResponse(nodes, links)

        List<Artist> artists = artistService.getAllArtists();

        List<GraphNode> artistNodes = new ArrayList<>();

        for (Artist artist : artists) {
            GraphNode node = new GraphNode(artist.getId(), artist.getName(), artist.getImageUrl());
            artistNodes.add(node);
        }

        List<DiscoveryEdge> edges = discoveryEdgeService.getAllEdges();
        List<GraphLink> links = new ArrayList<>();

        for (DiscoveryEdge edge : edges) {
            if(edge.getFromArtist() != null) {
                GraphLink link = new GraphLink(edge.getFromArtist().getId(), edge.getToArtist().getId(), edge.getConnectorName(), edge.getEdgeType(), edge.getNotes());
                links.add(link);
            }
        }

        GraphResponse newResponse = new GraphResponse(artistNodes, links);

        return newResponse;
    }
}