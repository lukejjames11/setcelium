package com.setcelium.dto;

public record ImportSummary(
    int addedCount, 
    int flaggedCount, 
    int skippedCount
) {}
