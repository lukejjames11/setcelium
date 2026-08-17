package com.setcelium.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
public class Artist {

    @Id
    @GeneratedValue
    private UUID id;

    private String name;
    private String imageUrl;

    public Artist() {}

    public Artist(String name, String imageUrl) {
        this.name = name;
        this.imageUrl = imageUrl;
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

    public String getImageUrl() {
        return this.imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

}