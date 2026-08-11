package com.setcelium.service;

import com.setcelium.dto.ImportSummary;
import com.setcelium.dto.ParsedConcert;
import com.setcelium.model.Concert;
import com.setcelium.repository.ConcertRepository;
import com.setcelium.service.parser.EmailParser;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.lang.StringBuilder;

@Service
public class MboxImportService {

    private final List<EmailParser> parsers;
    private final ConcertRepository concertRepository;

    public MboxImportService(List<EmailParser> parsers, ConcertRepository concertRepository) {
        this.parsers = parsers;
        this.concertRepository = concertRepository;
    }

    /**
     * Entry point — orchestrates the full import.
     * Reads the mbox file, loops through each message, finds a matching
     * parser, checks for duplicates, saves or flags each concert, and
     * returns a summary of what happened.
     */
    public ImportSummary process(InputStream mboxFile) {
        // TODO:
        // 1. Call readMboxMessages(mboxFile) to get List<Message>
        // 2. Loop through each message
        // 3. For each: findParser -> if null, skip
        // 4. If found: parser.parse(message) -> ParsedConcert
        // 5. Check duplicate via concertRepository.existsByOrderNumber
        // 6. If not duplicate: buildConcertFrom, save, increment added/flagged
        // 7. Track counts, return new ImportSummary(added, flagged, skipped)

        List<Message> messages = readMboxMessages(mboxFile);

        int added = 0;
        int flagged = 0;
        int skipped = 0;

        for (Message message : messages) {
            EmailParser parser = findParser(message);
            if (parser == null) {
                continue;
            }
            ParsedConcert parsed = parser.parse(message);
            if (parsed.orderNumber() != null && concertRepository.existsByOrderNumber(parsed.orderNumber())) {
                skipped++;
                continue;
            }

            Concert newConcert = buildConcertFrom(parsed);
            concertRepository.save(newConcert);
            if(parsed.confident() == true) {
                added++;
            }
            else {
                flagged++;
            }
        }
        return new ImportSummary(added, flagged, skipped);
    }

    private Message chunkToMessage(String chunkText) {
        try {    
            Session session = Session.getDefaultInstance(new Properties());
            InputStream chunkStream = new ByteArrayInputStream(chunkText.getBytes());
            return new MimeMessage(session, chunkStream);
        }
        catch (MessagingException e) {
            return null;
        }
    }

    /**
     * Splits a raw .mbox file into individual Message objects.
     * .mbox format separates emails with a line starting "From "
     * (literal "From" + space, at the start of a line).
     */
    private List<Message> readMboxMessages(InputStream mboxFile) {
        // TODO:
        // 1. Read mboxFile line by line
        // 2. Buffer lines into a chunk; start a new chunk when a line
        //    matches the "From " delimiter pattern
        // 3. For each completed chunk, wrap as bytes, construct a
        //    MimeMessage(session, inputStream), add to the list
        // 4. Wrap in try/catch — don't let one malformed chunk kill
        //    the whole read; consider what to do if the file is empty

        List<Message> messages = new ArrayList<>();
        StringBuilder currentChunk = new StringBuilder();

        try {
            BufferedReader reader = new BufferedReader(new InputStreamReader(mboxFile));
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.startsWith("From ")) {
                    if (currentChunk.length() != 0) {
                        Message message = chunkToMessage(currentChunk.toString());
                        if (message != null) {
                            messages.add(message);
                        }
                        currentChunk = new StringBuilder();
                    } 
                }
                else {
                    currentChunk.append(line).append("\n");
                }
            }

            if (currentChunk.length() != 0) {
                Message message = chunkToMessage(currentChunk.toString());
                if (message != null) {
                    messages.add(message);
                }
            }

        }
        catch (IOException e) {
            return messages;
        }

        return messages;
    }

    /**
     * Returns the first EmailParser that recognizes this message,
     * or null if none of the registered parsers match.
     */
    private EmailParser findParser(Message message) {
        // TODO: loop through `parsers`, return first where supports() is true

        for (EmailParser parser : parsers) {
            if(parser.supports(message)) {
                return parser;
            }
        }
        return null;
    }

    /**
     * Maps a ParsedConcert (raw parser output) into a Concert entity
     * ready to persist. needsReview is the inverse of parsed.confident().
     */
    private Concert buildConcertFrom(ParsedConcert parsed) {
        // TODO: construct and return a new Concert from the parsed fields

        boolean needsReview = !parsed.confident();

        Concert newConcert = new Concert(parsed.artist(), parsed.venue(), parsed.showDate(), parsed.city(), parsed.state(), "ticketmaster_import", parsed.orderNumber(), needsReview);

        return newConcert;
    }
}
