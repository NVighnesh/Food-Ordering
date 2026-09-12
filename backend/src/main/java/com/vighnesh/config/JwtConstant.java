package com.vighnesh.config;

import java.nio.charset.StandardCharsets;

public class JwtConstant {
    private static final int MIN_SECRET_KEY_BYTES = 32;

    /**
     * Preserve the existing public API while requiring deployment-time configuration.
     */
    public static final String SECRET_KEY = loadSecretKey();
    public static final String JWT_HEADER = "Authorization";

    private static String loadSecretKey() {
        String secret = System.getenv("JWT_SECRET");
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET environment variable is required and must contain at least "
                            + MIN_SECRET_KEY_BYTES + " bytes.");
        }
        if (secret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_KEY_BYTES) {
            throw new IllegalStateException(
                    "JWT_SECRET environment variable must contain at least "
                            + MIN_SECRET_KEY_BYTES + " bytes.");
        }
        return secret;
    }
}
