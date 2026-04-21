package com.pfa.backend.service;

import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    public String store(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only image files are accepted. Received: " + contentType);
        }

        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String uniqueName = UUID.randomUUID() + ".jpg";
            Path targetLocation = uploadPath.resolve(uniqueName);

            // Compress to max 1200px width, 85% JPEG quality
            Thumbnails.of(file.getInputStream())
                    .width(1200)
                    .keepAspectRatio(true)
                    .outputQuality(0.85)
                    .outputFormat("jpg")
                    .toFile(targetLocation.toFile());

            return "/uploads/" + uniqueName;

        } catch (IOException ex) {
            throw new RuntimeException("Failed to store file: " + ex.getMessage(), ex);
        }
    }
}