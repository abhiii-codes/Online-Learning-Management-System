package com.lms.filter;

import com.lms.model.Role;
import com.lms.model.User;
import com.lms.util.JsonUtils;
import com.lms.util.SecurityUtils;
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Optional;
import java.util.Set;

/**
 * Centralized Authentication & Access Control Filter intercepting all /api/* routes.
 * Demonstrates:
 * 1. Declarative servlet filter architecture (Jakarta Servlet 6.0 @WebFilter).
 * 2. Defense-in-depth: Prevents accidental unauthenticated access across all endpoints.
 * 3. Exact path matching using container-decoded getServletPath() + getPathInfo().
 * 4. Polymorphic administrative role enforcement on /api/users, /api/audit-logs, /api/settings.
 * 5. Default-deny role route authorization for course creation and quiz submissions.
 * 6. Cache-control security headers preventing sensitive data leakage.
 */
@WebFilter(filterName = "AuthFilter", urlPatterns = "/api/*")
public class AuthFilter implements Filter {

    private static final Logger LOGGER = LoggerFactory.getLogger(AuthFilter.class);

    private static final Set<String> PUBLIC_AUTH_PATHS = Set.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/logout"
    );

    @Override
    public void init(FilterConfig filterConfig) {}

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        // Security headers: strictly prevent caching of authenticated API endpoints
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        response.setDateHeader("Expires", 0);

        // Build normalized, container-decoded path from getServletPath() and getPathInfo().
        // Prevents percent-encoded bypass attacks (e.g. /api/%75sers) dodging prefix checks.
        String servletPath = request.getServletPath() != null ? request.getServletPath() : "";
        String pathInfo = request.getPathInfo() != null ? request.getPathInfo() : "";
        String relativePath = servletPath + pathInfo;
        if (relativePath.isEmpty()) {
            relativePath = "/";
        }

        // Normalize trailing slash (except root "/")
        if (relativePath.length() > 1 && relativePath.endsWith("/")) {
            relativePath = relativePath.substring(0, relativePath.length() - 1);
        }

        // 1. Allow public authentication endpoints via exact match
        if (PUBLIC_AUTH_PATHS.contains(relativePath)) {
            chain.doFilter(req, res);
            return;
        }

        // 2. Allow public course catalog browsing (GET /api/courses or /api/courses/{id})
        if ("GET".equalsIgnoreCase(request.getMethod())) {
            if (relativePath.equals("/api/courses") || relativePath.matches("^/api/courses/\\d+$")) {
                chain.doFilter(req, res);
                return;
            }
        }

        // 3. Defense-in-depth Authentication Check
        Optional<User> currentUser = SecurityUtils.getCurrentUser(request);
        if (currentUser.isEmpty()) {
            LOGGER.warn("Unauthorized API access blocked by AuthFilter: {} {}", request.getMethod(), relativePath);
            JsonUtils.sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Authentication required. Please log in.");
            return;
        }

        User user = currentUser.get();
        String method = request.getMethod();

        // 4. Admin-Only Route Enforcement (Polymorphic check via user.hasAdministrativePrivileges())
        if (relativePath.startsWith("/api/audit-logs") ||
            relativePath.startsWith("/api/users") ||
            relativePath.startsWith("/api/settings")) {
            if (!user.hasAdministrativePrivileges()) {
                LOGGER.warn("Forbidden API access blocked by AuthFilter: user {} ({}) attempted {}",
                        user.getId(), user.getRole(), relativePath);
                JsonUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Access denied: Administrator privileges required.");
                return;
            }
        }

        // 5. Staff Mutations (Courses, Quiz Questions): Students prohibited
        if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) || "DELETE".equalsIgnoreCase(method)) {
            if (relativePath.startsWith("/api/courses") && user.getRole() == Role.STUDENT) {
                JsonUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Access denied: Students cannot modify course catalog.");
                return;
            }
            if (relativePath.startsWith("/api/quizzes") && !relativePath.endsWith("/submit") && user.getRole() == Role.STUDENT) {
                JsonUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Access denied: Students cannot manage quiz content.");
                return;
            }
        }

        // 6. Student Attempts (/submit): Non-students prohibited
        if (relativePath.matches("^/api/quizzes/\\d+/submit$") && user.getRole() != Role.STUDENT) {
            JsonUtils.sendError(response, HttpServletResponse.SC_FORBIDDEN, "Access denied: Only students can submit quiz attempts.");
            return;
        }

        // Authenticated and authorized: proceed down the chain
        chain.doFilter(req, res);
    }

    @Override
    public void destroy() {}
}
