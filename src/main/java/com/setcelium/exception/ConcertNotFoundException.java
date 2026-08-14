package com.setcelium.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class ConcertNotFoundException extends RuntimeException {
    public ConcertNotFoundException(String message) {
        super(message);
    }
}