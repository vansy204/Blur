package com.fileservice.service;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Service
public class FileService {
    public Object uploadFile(MultipartFile file) throws IOException {
        Path folder = Paths.get("C:/upload");
        if (!Files.exists(folder)) {
            Files.createDirectories(folder);
        }
        String fileExtention = StringUtils.getFilenameExtension(file.getOriginalFilename());

        String fileName = Objects.isNull(fileExtention)
                ? UUID.randomUUID().toString()
                : UUID.randomUUID() + "." + fileExtention;

        Path filePath = folder.resolve(fileName).normalize().toAbsolutePath();

        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        return null;


    }
}
