package com.setcelium.dto;

import java.util.UUID;

public record GraphLink(UUID source, UUID target, String connectorName, String edgeType, String notes) {}