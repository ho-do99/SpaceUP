package com.spaceup.domain.file.service;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.spaceup.global.config.ObjectStorageProperties;
import com.spaceup.global.error.FileNotFoundException;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

/**
 * Keeps the public image URL contract unchanged: /api/files/images/{name}.
 * When Object Storage is enabled, only the file bytes move to the private NCP
 * bucket; database fields and front-end callers continue storing that URL.
 */
@Service
public class ImageStoreService {

    private static final String OBJECT_KEY_PREFIX = "images/";

    @Value("${file.upload-dir}")
    private String uploadDir;

    private final ObjectStorageProperties objectStorageProperties;
    private final ObjectProvider<S3Client> objectStorageClientProvider;

    public ImageStoreService(ObjectStorageProperties objectStorageProperties,
            ObjectProvider<S3Client> objectStorageClientProvider) {
        this.objectStorageProperties = objectStorageProperties;
        this.objectStorageClientProvider = objectStorageClientProvider;
    }

    public String store(MultipartFile multipartFile) {
        if (multipartFile == null || multipartFile.isEmpty()) {
            throw new IllegalArgumentException("Image file is required.");
        }
        String contentType = multipartFile.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files can be uploaded.");
        }

        String storeFileName = UUID.randomUUID() + extensionOf(multipartFile.getOriginalFilename());
        try {
            if (usesObjectStorage()) {
                try (InputStream input = multipartFile.getInputStream()) {
                    putObject(storeFileName, input, multipartFile.getSize(), contentType);
                }
            } else {
                multipartFile.transferTo(new File(ensureLocalDirectory(), storeFileName));
            }
            return storeFileName;
        } catch (IOException e) {
            throw new IllegalStateException("Could not store image.", e);
        }
    }

    public String storeBytes(byte[] data, String extension) {
        String storeFileName = UUID.randomUUID() + extension;
        try {
            if (usesObjectStorage()) {
                putObject(storeFileName, new ByteArrayInputStream(data), data.length, resolveContentType(extension));
            } else {
                java.nio.file.Files.write(new File(ensureLocalDirectory(), storeFileName).toPath(), data);
            }
            return storeFileName;
        } catch (IOException e) {
            throw new IllegalStateException("Could not store generated image.", e);
        }
    }

    public Resource loadAsResource(String storeFileName) {
        if (usesObjectStorage()) {
            try {
                byte[] bytes = objectStorageClient().getObjectAsBytes(GetObjectRequest.builder()
                        .bucket(objectStorageProperties.bucket())
                        .key(objectKey(storeFileName))
                        .build()).asByteArray();
                return new ByteArrayResource(bytes);
            } catch (NoSuchKeyException e) {
                throw new FileNotFoundException("Image file was not found: " + storeFileName);
            } catch (S3Exception e) {
                if (e.statusCode() == 404) {
                    throw new FileNotFoundException("Image file was not found: " + storeFileName);
                }
                throw new IllegalStateException("Could not read image from Object Storage.", e);
            }
        }

        try {
            Path baseDir = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path filePath = baseDir.resolve(storeFileName).normalize();
            if (!filePath.startsWith(baseDir)) {
                throw new FileNotFoundException("Invalid image path: " + storeFileName);
            }
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new FileNotFoundException("Image file was not found: " + storeFileName);
        } catch (MalformedURLException e) {
            throw new FileNotFoundException("Invalid image path: " + storeFileName);
        }
    }

    private boolean usesObjectStorage() {
        return objectStorageProperties.enabled();
    }

    private S3Client objectStorageClient() {
        S3Client client = objectStorageClientProvider.getIfAvailable();
        if (client == null) {
            throw new IllegalStateException("Object Storage client is not configured.");
        }
        return client;
    }

    private void putObject(String storeFileName, InputStream data, long contentLength, String contentType) {
        objectStorageClient().putObject(PutObjectRequest.builder()
                .bucket(objectStorageProperties.bucket())
                .key(objectKey(storeFileName))
                .contentType(contentType)
                .build(), RequestBody.fromInputStream(data, contentLength));
    }

    private File ensureLocalDirectory() {
        File dir = new File(uploadDir).getAbsoluteFile();
        if (!dir.exists() && !dir.mkdirs()) {
            throw new IllegalStateException("Could not create local image directory.");
        }
        return dir;
    }

    private String objectKey(String storeFileName) {
        return OBJECT_KEY_PREFIX + storeFileName;
    }

    private String extensionOf(String filename) {
        return filename != null && filename.contains(".") ? filename.substring(filename.lastIndexOf(".")) : "";
    }

    private String resolveContentType(String extension) {
        return switch (extension == null ? "" : extension.toLowerCase()) {
            case ".png" -> "image/png";
            case ".gif" -> "image/gif";
            case ".webp" -> "image/webp";
            default -> "image/jpeg";
        };
    }
}
