package com.lms.servlet;

import com.lms.config.AppContext;
import com.lms.exception.ResourceNotFoundException;
import com.lms.exception.UnauthorizedException;
import com.lms.exception.ValidationException;
import com.lms.model.User;
import com.lms.service.AuthService;
import com.lms.util.JsonUtils;
import com.lms.util.SecurityUtils;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;

/**
 * Servlet handling user authentication, registration, session persistence, and logout.
 */
@WebServlet(name = "AuthServlet", urlPatterns = "/api/auth/*")
public class AuthServlet extends BaseServlet {

    private final AuthService authService = AppContext.getAuthService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo();
        if ("/me".equals(path)) {
            Optional<User> userOpt = SecurityUtils.getCurrentUser(req);
            if (userOpt.isPresent()) {
                JsonUtils.sendSuccess(resp, userOpt.get());
            } else {
                throw new UnauthorizedException("Authentication required. Please log in.");
            }
        } else {
            throw new ResourceNotFoundException("Endpoint", path != null ? path : "/");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo();
        if (path == null) {
            throw new ValidationException("Authentication path cannot be empty.");
        }

        switch (path) {
            case "/login": {
                @SuppressWarnings("unchecked")
                Map<String, String> body = JsonUtils.readBody(req, Map.class);
                if (body == null) {
                    throw new ValidationException("Request body cannot be empty.");
                }
                String email = body.get("email");
                String password = body.get("password");

                User user = authService.authenticate(email, password);
                SecurityUtils.setSessionUser(req, user);

                JsonUtils.sendSuccess(resp, "Login successful", user);
                break;
            }
            case "/register": {
                @SuppressWarnings("unchecked")
                Map<String, String> body = JsonUtils.readBody(req, Map.class);
                if (body == null) {
                    throw new ValidationException("Request body cannot be empty.");
                }
                String name = body.get("name");
                String email = body.get("email");
                String password = body.get("password");

                User student = authService.registerStudent(name, email, password);
                SecurityUtils.setSessionUser(req, student);

                JsonUtils.sendSuccess(resp, HttpServletResponse.SC_CREATED, "Registration successful", student);
                break;
            }
            case "/logout": {
                SecurityUtils.invalidateSession(req);
                JsonUtils.sendSuccess(resp, "Logged out successfully", null);
                break;
            }
            default:
                throw new ResourceNotFoundException("Endpoint", path);
        }
    }
}
