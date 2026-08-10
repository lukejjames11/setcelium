package com.setcelium.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
public class Concert {

    @Id
    @GeneratedValue
    private UUID id;

    private String artist;
    private String venue;
    private LocalDate showDate;
    private String city;
    private String state;
    private String source;        // e.g. "ticketmaster_import" or "manual"
    private String orderNumber;   // used for dedup on import, nullable for manual entries
    private boolean needsReview;  // true if import confidence was low

    public Concert() {

    }

    public Concert(String artist, String venue, LocalDate showDate, String city, String state, String source, String orderNumber, boolean needsReview) {
        this.artist = artist;
        this.venue = venue;
        this.showDate = showDate;
        this.city = city;
        this.state = state;
        this.source = source;
        this.orderNumber = orderNumber;
        this.needsReview = needsReview;
    }

    // getters and setters below

    public String getArtist() {
        return this.artist;
    }

    public void setArtist(String artist) {
        this.artist = artist;
    }

    public String getVenue() {
        return this.venue;
    }

    public void setVenue(String venue) {
        this.venue = venue;
    }

    public LocalDate getShowDate() {
        return this.showDate;
    }

    public void setShowDate(LocalDate showDate) {
        this.showDate = showDate;
    }

    public String getCity() {
        return this.city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return this.state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getSource() {
        return this.source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getOrderNumber() {
        return this.orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public boolean isNeedsReview() {
        return this.needsReview;
    }

    public void setNeedsReview(boolean needsReview) {
        this.needsReview = needsReview;
    }

    public UUID getId() {
        return this.id;
    }
}
