package com.setcelium.controller;

import com.setcelium.dto.ImportSummary;
import com.setcelium.service.MboxImportService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

@RestController
@RequestMapping("/api/import")
public class ImportController {

    private final MboxImportService importService;

    public ImportController(MboxImportService importService) {
        this.importService = importService;
    }

    @PostMapping("/mbox")
    public ImportSummary uploadMbox(@RequestParam("file") MultipartFile file) {
        try {
            InputStream inputStream = file.getInputStream();
            return importService.process(inputStream);
        } catch (IOException e) {
            return new ImportSummary(0, 0, 0);
        }
    }
}