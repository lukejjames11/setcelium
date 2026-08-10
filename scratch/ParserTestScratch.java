package com.setcelium;

import com.setcelium.dto.ParsedConcert;
import com.setcelium.service.parser.TicketmasterParser;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;

import java.io.FileInputStream;
import java.util.Properties;

public class ParserTestScratch {
    public static void main(String[] args) throws Exception {
        Properties props = new Properties();
        Session session = Session.getDefaultInstance(props);

        FileInputStream fis = new FileInputStream("/Users/lukejames/Documents/setcelium/docs/ref/billy-strings.eml");
        MimeMessage message = new MimeMessage(session, fis);

        TicketmasterParser parser = new TicketmasterParser();
        parser.setApiKeyForTesting(System.getenv("ANTHROPIC_API_KEY"));

        String key = System.getenv("ANTHROPIC_API_KEY");
        parser.setApiKeyForTesting(key);

        System.out.println("supports() = " + parser.supports(message));

        ParsedConcert result = parser.parse(message);
        System.out.println();
        System.out.println("artist: " + result.artist());
        System.out.println("venue: " + result.venue());
        System.out.println("city: " + result.city());
        System.out.println("state: " + result.state());
        System.out.println("showDate: " + result.showDate());
        System.out.println("orderNumber: " + result.orderNumber());
        System.out.println("confident: " + result.confident());
    }
}
