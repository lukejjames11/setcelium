package com.setcelium.service.parser;

import com.setcelium.dto.ParsedConcert;
import jakarta.mail.Message;

public interface EmailParser {
    boolean supports(Message message);
    ParsedConcert parse(Message message);
}
