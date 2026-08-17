package com.setcelium.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
public class DiscoveryEdge {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "from_artist_id")
    private Artist fromArtist;

    @ManyToOne
    @JoinColumn(name = "to_artist_id", nullable = false)
    private Artist toArtist;

    private String connectorName; // nullable — who/what bridged the connection
    private String edgeType;      // plain string, per our decision
    private String notes;         // freeform discovery story

    public DiscoveryEdge() {}

    public DiscoveryEdge(Artist fromArtist, Artist toArtist, String connectorName, String edgeType, String notes) {
        this.fromArtist = fromArtist;
        this.toArtist = toArtist;
        this.connectorName = connectorName;
        this.edgeType = edgeType;
        this.notes = notes;
    }

    // TODO: all-args constructor — parameters: fromArtist, toArtist,
    // connectorName, edgeType, notes (id excluded, auto-generated)

    // TODO: getter for id (no setter)
    public UUID getId() {
        return this.id;
    }

    // TODO: getters/setters for fromArtist, toArtist, connectorName,
    // edgeType, notes

    public Artist getFromArtist() {
        return this.fromArtist;
    }

    public void setFromArtist(Artist fromArtist) {
        this.fromArtist = fromArtist;
    }

    public Artist getToArtist() {
        return this.toArtist;
    }

    public void setToArtist(Artist toArtist) {
        this.toArtist = toArtist;
    }

    public String getConnectorName() {
        return this.connectorName;
    }

    public void setConnectorName(String connectorName) {
        this.connectorName = connectorName;
    }

    public String getEdgeType() {
        return this.edgeType;
    }

    public void setEdgeType(String edgeType) {
        this.edgeType = edgeType;
    }

    public String getNotes() {
        return this.notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

}