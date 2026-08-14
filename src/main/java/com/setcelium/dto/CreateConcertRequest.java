package com.setcelium.dto;

import java.time.LocalDate;

public record CreateConcertRequest(
    String artist,
    String venue,
    String city,
    String state,
    LocalDate showDate
) {}

