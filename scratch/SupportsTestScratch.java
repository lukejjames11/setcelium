package com.setcelium;

import com.setcelium.dto.ParsedConcert;
import com.setcelium.service.MboxImportService;
import com.setcelium.service.parser.EmailParser;
import com.setcelium.service.parser.TicketmasterParser;
import jakarta.mail.Message;

import java.io.FileInputStream;
import java.util.List;


public class SupportsTestScratch {
    public static void main(String[] args) throws Exception {
        MboxImportService importService = new MboxImportService(null, null); // parsers/repo not needed for this test
        TicketmasterParser parser = new TicketmasterParser();

        FileInputStream fis = new FileInputStream("/Users/lukejames/Downloads/Takeout/Mail/Ticketmaster.mbox");
        List<Message> messages = importService.readMboxMessages(fis);

        int totalMessages = messages.size();
        int matched = 0;

        for (Message message : messages) {
            boolean supports = parser.supports(message);
            if (supports) {
                matched++;
                System.out.println("MATCH: " + message.getSubject());
            }
        }

        System.out.println("Total messages: " + totalMessages);
        System.out.println("Matched (will be sent to LLM): " + matched);
    }
}