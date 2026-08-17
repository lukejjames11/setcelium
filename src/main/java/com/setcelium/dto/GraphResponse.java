package com.setcelium.dto;

import java.util.List;

public record GraphResponse(List<GraphNode> nodes, List<GraphLink> links) {}