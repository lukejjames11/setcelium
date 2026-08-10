package com.setcelium.dto;

import java.time.LocalDate;

public record ParsedConcert(
    String artist,
    String venue,
    String city, 
    String state, 
    LocalDate showDate,
    String orderNumber,
    boolean confident
) {}
