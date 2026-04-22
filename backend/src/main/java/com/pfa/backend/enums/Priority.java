package com.pfa.backend.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

import java.util.Arrays;
import java.util.Locale;

public enum Priority {
    Low, Medium, High, Emergency;

    @JsonCreator
    public static Priority fromValue(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return null;
        }

        String normalizedValue = rawValue.trim().replace('-', '_').replace(' ', '_').toUpperCase(Locale.ROOT);

        return Arrays.stream(values())
                .filter(priority -> priority.name().toUpperCase(Locale.ROOT).equals(normalizedValue))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Invalid priority value '%s'. Accepted values: Low, Medium, High, Emergency."
                                .formatted(rawValue)));
    }
}