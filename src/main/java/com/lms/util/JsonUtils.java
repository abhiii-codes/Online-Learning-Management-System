package com.lms.util;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.lms.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.InputStream;

/**
 * Utility for Jackson JSON serialization, deserialization, and HTTP response writing.
 */
public final class JsonUtils {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    static {
        MAPPER.registerModule(new JavaTimeModule());
        MAPPER.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        MAPPER.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    private JsonUtils() {
    }

    public static ObjectMapper getMapper() {
        return MAPPER;
    }

    public static <T> T fromJson(String json, Class<T> clazz) throws IOException {
        return MAPPER.readValue(json, clazz);
    }

    public static <T> T fromInputStream(InputStream in, Class<T> clazz) throws IOException {
        return MAPPER.readValue(in, clazz);
    }

    public static <T> T readBody(HttpServletRequest req, Class<T> clazz) throws IOException {
        try {
            return MAPPER.readValue(req.getInputStream(), clazz);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new com.lms.exception.ValidationException("Malformed or unparseable JSON payload: " + e.getOriginalMessage());
        }
    }

    public static String toJson(Object object) throws IOException {
        return MAPPER.writeValueAsString(object);
    }

    public static void sendJson(HttpServletResponse resp, int statusCode, Object data) throws IOException {
        resp.setStatus(statusCode);
        resp.setContentType("application/json;charset=UTF-8");
        MAPPER.writeValue(resp.getOutputStream(), data);
    }

    public static <T> void sendSuccess(HttpServletResponse resp, T data) throws IOException {
        sendJson(resp, HttpServletResponse.SC_OK, ApiResponse.success(data));
    }

    public static <T> void sendSuccess(HttpServletResponse resp, String message, T data) throws IOException {
        sendJson(resp, HttpServletResponse.SC_OK, ApiResponse.success(message, data));
    }

    public static <T> void sendSuccess(HttpServletResponse resp, int statusCode, String message, T data) throws IOException {
        sendJson(resp, statusCode, ApiResponse.success(message, data));
    }

    public static void sendError(HttpServletResponse resp, int statusCode, String errorMessage) throws IOException {
        sendJson(resp, statusCode, ApiResponse.error(errorMessage));
    }
}
