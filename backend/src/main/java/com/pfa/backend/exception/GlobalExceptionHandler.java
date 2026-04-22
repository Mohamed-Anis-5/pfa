package com.pfa.backend.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageConversionException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
        return ResponseEntity.status(status).body(errorBody(status, ex.getReason()));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(errorBody(HttpStatus.NOT_FOUND, ex.getMessage()));
    }

    @ExceptionHandler(InvalidTransitionException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidTransition(InvalidTransitionException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(errorBody(HttpStatus.BAD_REQUEST, ex.getMessage()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(errorBody(HttpStatus.CONFLICT, "A record with the same unique value already exists"));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxUploadSizeExceeded(MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(errorBody(HttpStatus.PAYLOAD_TOO_LARGE, "Image upload is limited to 10 MB."));
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<Map<String, Object>> handleMultipartException(MultipartException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(errorBody(HttpStatus.BAD_REQUEST, "The uploaded file could not be processed. Please use an image up to 10 MB."));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        Throwable mostSpecificCause = ex.getMostSpecificCause();
        String message = mostSpecificCause != null && mostSpecificCause.getMessage() != null
                ? mostSpecificCause.getMessage()
                : "Invalid request payload.";

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(errorBody(HttpStatus.BAD_REQUEST, message));
    }

        @ExceptionHandler(HttpMessageConversionException.class)
        public ResponseEntity<Map<String, Object>> handleHttpMessageConversion(HttpMessageConversionException ex) {
        Throwable mostSpecificCause = ex.getMostSpecificCause();
        String message = mostSpecificCause != null && mostSpecificCause.getMessage() != null
            ? mostSpecificCause.getMessage()
            : "Invalid request payload.";

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(errorBody(HttpStatus.BAD_REQUEST, message));
        }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        log.error("Unhandled exception: {}: {}", ex.getClass().getName(), ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorBody(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error"));
    }

    private Map<String, Object> errorBody(HttpStatus status, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return body;
    }
}
