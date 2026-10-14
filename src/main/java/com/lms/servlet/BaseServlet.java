package com.lms.servlet;

import com.lms.exception.*;
import com.lms.util.JsonUtils;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

/**
 * Base HttpServlet controller providing centralized error dispatch and helper routines.
 * Demonstrates:
 * 1. Centralized exception-to-HTTP mapping (RFC 7231 / RFC 9110 status codes).
 * 2. Strict JSON responses (never returns Tomcat's default HTML error pages).
 * 3. Maps NumberFormatException / IllegalArgumentException to 400 Bad Request.
 * 4. Maps CourseFullException, AlreadyEnrolledException, and DuplicateKeyException to 409 Conflict.
 */
public abstract class BaseServlet extends HttpServlet {

    protected final Logger logger = LoggerFactory.getLogger(getClass());

    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json;charset=UTF-8");
        resp.setCharacterEncoding("UTF-8");

        // Secondary CSRF defense layer: Enforce application/json Content-Type for state-changing requests
        String method = req.getMethod();
        if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) || "PATCH".equalsIgnoreCase(method)) {
            String contentType = req.getContentType();
            String contentLengthHeader = req.getHeader("Content-Length");
            int contentLength = req.getContentLength();
            boolean hasBody = contentLength > 0
                    || (contentLengthHeader != null && !"0".equals(contentLengthHeader.trim()))
                    || "chunked".equalsIgnoreCase(req.getHeader("Transfer-Encoding"));
            if (contentType == null) {
                if (hasBody) {
                    logger.warn("Unsupported Media Type [415] on {}: missing Content-Type on payload", req.getRequestURI());
                    JsonUtils.sendError(resp, HttpServletResponse.SC_UNSUPPORTED_MEDIA_TYPE, "Content-Type must be application/json.");
                    return;
                }
            } else if (!contentType.trim().toLowerCase(java.util.Locale.ROOT).contains("application/json")) {
                logger.warn("Unsupported Media Type [415] on {}: {}", req.getRequestURI(), contentType);
                JsonUtils.sendError(resp, HttpServletResponse.SC_UNSUPPORTED_MEDIA_TYPE, "Content-Type must be application/json.");
                return;
            }
        }

        try {
            super.service(req, resp);
        } catch (ValidationException e) {
            // Explicit domain validation errors (400 Bad Request)
            logger.warn("Client validation error [400] on {}: {}", req.getRequestURI(), e.getMessage());
            JsonUtils.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (CourseFullException | ConflictException | DuplicateKeyException e) {
            // 409 Conflict: Covers CourseFullException, ConflictException, and DuplicateKeyException
            logger.warn("Conflict state exception [409] on {}: {}", req.getRequestURI(), e.getMessage());
            JsonUtils.sendError(resp, HttpServletResponse.SC_CONFLICT, e.getMessage());
        } catch (UnauthorizedException e) {
            logger.warn("Unauthorized [401] on {}: {}", req.getRequestURI(), e.getMessage());
            JsonUtils.sendError(resp, HttpServletResponse.SC_UNAUTHORIZED, e.getMessage());
        } catch (ForbiddenException e) {
            logger.warn("Forbidden [403] on {}: {}", req.getRequestURI(), e.getMessage());
            JsonUtils.sendError(resp, HttpServletResponse.SC_FORBIDDEN, e.getMessage());
        } catch (ResourceNotFoundException e) {
            logger.warn("Not found [404] on {}: {}", req.getRequestURI(), e.getMessage());
            JsonUtils.sendError(resp, HttpServletResponse.SC_NOT_FOUND, e.getMessage());
        } catch (LmsException e) {
            logger.warn("Handled domain exception [{}] on {}: {}", e.getStatusCode(), req.getRequestURI(), e.getMessage());
            JsonUtils.sendError(resp, e.getStatusCode(), e.getMessage());
        } catch (IllegalArgumentException e) {
            // Client parsing error (e.g. enum parsing or number format): log safely and sanitize output
            logger.warn("Client parameter parse error [400] on {}: {}", req.getRequestURI(), e.getMessage());
            JsonUtils.sendError(resp, HttpServletResponse.SC_BAD_REQUEST, "Invalid request parameters.");
        } catch (Exception e) {
            logger.error("Unhandled internal server error on {}: {}", req.getRequestURI(), e.getMessage(), e);
            JsonUtils.sendError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "An internal server error occurred.");
        }
    }

    /**
     * Extracts path variable after servlet mapping (e.g. /api/courses/{id} -> id).
     */
    protected String extractPathSegment(HttpServletRequest req) {
        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            return null;
        }
        String[] parts = pathInfo.split("/");
        return parts.length > 1 ? parts[1] : null;
    }

    /**
     * Parses a Long ID from pathInfo (e.g. /12 -> 12).
     */
    protected Long parseIdFromPath(HttpServletRequest req) {
        String segment = extractPathSegment(req);
        if (segment == null || segment.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(segment);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Safely parses an integer query parameter, falling back to a default if missing or invalid.
     */
    protected int getIntParam(HttpServletRequest req, String paramName, int defaultValue) {
        String val = req.getParameter(paramName);
        if (val == null || val.isBlank()) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(val.trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}
