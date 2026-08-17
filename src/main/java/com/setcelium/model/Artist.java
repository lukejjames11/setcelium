package com.setcelium.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
public class Artist {

    @Id
    @GeneratedValue
    private UUID id;

    private String name;

    public Artist() {}

    public Artist(String name) {
        this.name = name;
    }

    public UUID getId() {
        return this.id;
    }

    public String getName() {
        return this.name;
    }

    public void setName(String name) {
        this.name = name;
    }

}