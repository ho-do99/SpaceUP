package com.spaceup.global.config;

import java.net.URI;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.checksums.RequestChecksumCalculation;
import software.amazon.awssdk.core.checksums.ResponseChecksumValidation;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
@EnableConfigurationProperties(ObjectStorageProperties.class)
public class ObjectStorageConfiguration {

    @Bean
    @ConditionalOnProperty(prefix = "object-storage", name = "enabled", havingValue = "true")
    S3Client objectStorageClient(ObjectStorageProperties properties) {
        if (isBlank(properties.accessKey()) || isBlank(properties.secretKey()) || isBlank(properties.bucket())) {
            throw new IllegalStateException(
                    "Object Storage is enabled but its access key, secret key, or bucket is missing.");
        }

        return S3Client.builder()
                .endpointOverride(URI.create(properties.endpoint()))
                .region(Region.of(properties.region()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(properties.accessKey(), properties.secretKey())))
                // AWS SDK 2.30+ adds CRC checksums by default. NCP Object Storage
                // rejects those optional S3 headers, so use checksums only when required.
                .requestChecksumCalculation(RequestChecksumCalculation.WHEN_REQUIRED)
                .responseChecksumValidation(ResponseChecksumValidation.WHEN_REQUIRED)
                .forcePathStyle(true)
                .build();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
