package com.setcelium.controller;

import com.setcelium.dto.GraphResponse;
import com.setcelium.service.GraphService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/graph")
public class GraphController {

    private final GraphService graphService;

    public GraphController(GraphService graphService) {
        this.graphService = graphService;
    }

    @GetMapping
    public GraphResponse getGraph() {
        // TODO: one line, delegate to graphService.buildGraph()
        return graphService.buildGraph();
    }
}