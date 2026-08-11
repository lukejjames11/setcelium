package com.setcelium.service.parser;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.setcelium.dto.ParsedConcert;
import jakarta.mail.Address;
import jakarta.mail.BodyPart;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.Multipart;
import org.jsoup.Jsoup;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class TicketmasterParser implements EmailParser {

    private static final String CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${anthropic.api.key}")
    private String apiKey;

    public void setApiKeyForTesting(String key) {
        this.apiKey = key;
    }

    @Override
    public boolean supports(Message message) {
        try {
            Address[] from = message.getFrom();
            if (from == null) {
                return false;
            }
            boolean senderMatches = false;
            for (Address address : from) {
                if (address.toString().contains("email.ticketmaster.com")) {
                    senderMatches = true;
                    break;
                }
            }
            if(!senderMatches) {
                return false;
            }

            String subject = message.getSubject();
            if(subject == null) {
                return false;
            }

            return subject.toLowerCase().contains("you got");

        } catch (MessagingException e) {
            return false;
        }
    }

    @Override
    public ParsedConcert parse(Message message) {
        String bodyText = extractBodyText(message);
        String subject = extractSubject(message);

        if (bodyText == null) {
            return new ParsedConcert(null, null, null, null, null, null, false);
        }

        return extractViaLLM(subject, bodyText);
    }

    private String extractBodyText(Message message) {
        try {
            Object content = message.getContent();
            if (content == null) {
                return null;
            }
            if (content instanceof Multipart multipart) {
                for (int i = 0; i < multipart.getCount(); i++) {
                    BodyPart part = multipart.getBodyPart(i);
                    if (part.isMimeType("text/html")) {
                        String html = (String) part.getContent();
                        return Jsoup.parse(html).text();
                    }
                }
                return null;
            } else if (content instanceof String htmlOrText) {
                return Jsoup.parse(htmlOrText).text();
            }
            return null;
        } catch (MessagingException e) {
            return null;
        } catch (IOException e) {
            return null;
        }
    }

    private String extractSubject(Message message) {
        try {
            return message.getSubject();
        } catch (MessagingException e) {
            return null;
        }
    }

    private ParsedConcert extractViaLLM(String subject, String bodyText) {
        try {
            String prompt = buildPrompt(subject, bodyText);
            String requestJson = buildRequestJson(prompt);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(CLAUDE_API_URL))
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .header("content-type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            return parseClaudeResponse(response.body());

        } catch (Exception e) {
            e.printStackTrace();
            return new ParsedConcert(null, null, null, null, null, null, false);
        }
    }

    private String buildPrompt(String subject, String bodyText) {
        return """
                Extract concert details from this Ticketmaster confirmation email.
                Respond with ONLY a JSON object, no other text, no markdown code fences,
                matching exactly this shape:
                {"artist": "...", "venue": "...", "city": "...", "state": "...", "showDate": "YYYY-MM-DD", "orderNumber": "..."}
                Use null (not the string "null") for any field you cannot confidently determine.

                Subject: %s

                Body:
                %s
                """.formatted(subject, bodyText);
    }

    private String buildRequestJson(String prompt) throws IOException {
        Map<String, Object> message = Map.of("role", "user", "content", prompt);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", "claude-haiku-4-5-20251001");
        body.put("max_tokens", 1024);
        body.put("messages", List.of(message));
        return objectMapper.writeValueAsString(body);
    }

    private ParsedConcert parseClaudeResponse(String responseBody) {
        try {
        JsonNode root = objectMapper.readTree(responseBody);
        String extractedJson = root.path("content").get(0).path("text").asText();
        extractedJson = stripCodeFence(extractedJson);

        JsonNode fields = objectMapper.readTree(extractedJson);

        String artist = fields.path("artist").asText(null);
        String venue = fields.path("venue").asText(null);
        String city = fields.path("city").asText(null);
        String state = fields.path("state").asText(null);
        String orderNumber = fields.path("orderNumber").asText(null);

        LocalDate showDate = null;
        String dateStr = fields.path("showDate").asText(null);
        if (dateStr != null) {
            try {
                showDate = LocalDate.parse(dateStr);
            } catch (DateTimeParseException ignored) {
                // leave showDate null
            }
        }

        boolean confident = artist != null && venue != null && showDate != null;

        return new ParsedConcert(artist, venue, city, state, showDate, orderNumber, confident);
    } catch (Exception e) {
        e.printStackTrace();
        return new ParsedConcert(null, null, null, null, null, null, false);
    }
}

private String stripCodeFence(String text) {
    String trimmed = text.trim();
    if (trimmed.startsWith("```")) {
        trimmed = trimmed.replaceFirst("^```(?:json)?", "");
        trimmed = trimmed.replaceFirst("```$", "");
    }
    return trimmed.trim();
}


}
