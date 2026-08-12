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

    // ⭐ [회원가입 전 사업자등록증 업로드] JWT 없이 호출되는 공개 API라 별도 폴더로 분리하고, 10MB로 더 낮게 제한합니다.
    private static final String BUSINESS_DOCUMENT_KEY_PREFIX = "business-documents/";
    private static final long BUSINESS_DOCUMENT_MAX_BYTES = 10L * 1024 * 1024;

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
                    putObject(OBJECT_KEY_PREFIX, storeFileName, input, multipartFile.getSize(), contentType);
                }
            } else {
                multipartFile.transferTo(new File(ensureLocalDirectory(""), storeFileName));
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
                putObject(OBJECT_KEY_PREFIX, storeFileName, new ByteArrayInputStream(data), data.length,
                        resolveContentType(extension));
            } else {
                java.nio.file.Files.write(new File(ensureLocalDirectory(""), storeFileName).toPath(), data);
            }
            return storeFileName;
        } catch (IOException e) {
            throw new IllegalStateException("Could not store generated image.", e);
        }
    }

    public Resource loadAsResource(String storeFileName) {
        return loadAsResource(OBJECT_KEY_PREFIX, "", storeFileName, "Image");
    }

    // ⭐ [회원가입 전 사업자등록증 업로드] 계정이 아직 없는 상태(JWT 없이 호출)라 별도 공개 API로 뺐습니다.
    // 이미지뿐 아니라 PDF도 받아야 하고, 20MB가 아니라 10MB로 더 낮게 제한합니다(요구사항).
    public String storeBusinessDocument(MultipartFile multipartFile) {
        if (multipartFile == null || multipartFile.isEmpty()) {
            throw new IllegalArgumentException("사업자등록증 파일이 필요합니다.");
        }
        if (multipartFile.getSize() > BUSINESS_DOCUMENT_MAX_BYTES) {
            throw new IllegalArgumentException("파일 크기가 10MB를 초과했습니다.");
        }
        String contentType = multipartFile.getContentType();
        boolean allowed = contentType != null
                && (contentType.equals("image/jpeg") || contentType.equals("image/png")
                        || contentType.equals("application/pdf"));
        if (!allowed) {
            throw new IllegalArgumentException("JPG, PNG, PDF 파일만 업로드할 수 있습니다.");
        }

        String storeFileName = UUID.randomUUID() + extensionOf(multipartFile.getOriginalFilename());
        try {
            if (usesObjectStorage()) {
                try (InputStream input = multipartFile.getInputStream()) {
                    putObject(BUSINESS_DOCUMENT_KEY_PREFIX, storeFileName, input, multipartFile.getSize(),
                            contentType);
                }
            } else {
                multipartFile.transferTo(new File(ensureLocalDirectory(BUSINESS_DOCUMENT_KEY_PREFIX), storeFileName));
            }
            return storeFileName;
        } catch (IOException e) {
            throw new IllegalStateException("Could not store business document.", e);
        }
    }

    public Resource loadBusinessDocumentAsResource(String storeFileName) {
        return loadAsResource(BUSINESS_DOCUMENT_KEY_PREFIX, BUSINESS_DOCUMENT_KEY_PREFIX, storeFileName,
                "Business document");
    }

    private Resource loadAsResource(String objectKeyPrefix, String localSubfolder, String storeFileName,
            String notFoundLabel) {
        if (usesObjectStorage()) {
            try {
                byte[] bytes = objectStorageClient().getObjectAsBytes(GetObjectRequest.builder()
                        .bucket(objectStorageProperties.bucket())
                        .key(objectKeyPrefix + storeFileName)
                        .build()).asByteArray();
                return new ByteArrayResource(bytes);
            } catch (NoSuchKeyException e) {
                throw new FileNotFoundException(notFoundLabel + " file was not found: " + storeFileName);
            } catch (S3Exception e) {
                if (e.statusCode() == 404) {
                    throw new FileNotFoundException(notFoundLabel + " file was not found: " + storeFileName);
                }
                throw new IllegalStateException("Could not read file from Object Storage.", e);
            }
        }

        try {
            Path baseDir = Paths.get(uploadDir, localSubfolder).toAbsolutePath().normalize();
            Path filePath = baseDir.resolve(storeFileName).normalize();
            if (!filePath.startsWith(baseDir)) {
                throw new FileNotFoundException("Invalid file path: " + storeFileName);
            }
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new FileNotFoundException(notFoundLabel + " file was not found: " + storeFileName);
        } catch (MalformedURLException e) {
            throw new FileNotFoundException("Invalid file path: " + storeFileName);
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

    private void putObject(String objectKeyPrefix, String storeFileName, InputStream data, long contentLength,
            String contentType) {
        objectStorageClient().putObject(PutObjectRequest.builder()
                .bucket(objectStorageProperties.bucket())
                .key(objectKeyPrefix + storeFileName)
                .contentType(contentType)
                .build(), RequestBody.fromInputStream(data, contentLength));
    }

    private File ensureLocalDirectory(String subfolder) {
        File dir = new File(uploadDir, subfolder).getAbsoluteFile();
        if (!dir.exists() && !dir.mkdirs()) {
            throw new IllegalStateException("Could not create local upload directory.");
        }
        return dir;
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
