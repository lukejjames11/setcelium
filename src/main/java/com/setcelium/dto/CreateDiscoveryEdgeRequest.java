package com.setcelium.dto;

public record CreateDiscoveryEdgeRequest(
    String fromArtistName, // nullable — no prior artist thread
    String toArtistName,
    String connectorName,
    String edgeType,
    String notes
) {}