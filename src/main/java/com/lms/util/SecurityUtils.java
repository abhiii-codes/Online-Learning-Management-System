package com.lms.util;

import com.lms.config.AppContext;
import com.lms.exception.ForbiddenException;
import com.lms.exception.UnauthorizedException;
import com.lms.model.Role;
import com.lms.model.User;
import com.lms.model.UserStatus;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;
import java.util.Optional;

/**
 * Security helper for session-based user authentication, fresh status validation, and role verification.
 */
public final class SecurityUtils {

    private static final Logger LOGGER = LoggerFactory.getLogger(SecurityUtils.class);
    public static final String SESSION_USER_KEY = "currentUser";

    private SecurityUtils() {
    }

    /**
     * Retrieves the authenticated user from the session.
     * Re-validates the user status from the database by ID to prevent stale session snapshots
     * (e.g., immediate revocation of access when a user is suspended or role is changed).
     */
    public static Optional<User> getCurrentUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            Object userObj = session.getAttribute(SESSION_USER_KEY);
            if (userObj instanceof User) {
                User sessionUser = (User) userObj;

                // Re-validate against database by PK to guard against stale session snapshots
                if (sessionUser.getId() != null) {
                    try {
                        Optional<User> freshOpt = AppContext.getUserDao().findById(sessionUser.getId());
                        if (freshOpt.isPresent()) {
                            User freshUser = freshOpt.get();
                            if (sessionUser.getEmail() != null && freshUser.getEmail().equalsIgnoreCase(sessionUser.getEmail())) {
                                if (freshUser.getStatus() != UserStatus.ACTIVE) {
                                    LOGGER.warn("Invalidating session for non-active user {} ({})", freshUser.getId(), freshUser.getStatus());
                                    try {
                                        session.invalidate();
                                    } catch (Exception ignored) {}
                                    return Optional.empty();
                                }
                                // Update session attribute with fresh database snapshot
                                session.setAttribute(SESSION_USER_KEY, freshUser);
                                return Optional.of(freshUser);
                            }
                        }
                    } catch (Exception e) {
                        LOGGER.debug("Could not refresh user from DB: {}", e.getMessage());
                    }
                }

                if (sessionUser.getStatus() != UserStatus.ACTIVE) {
                    try {
                        session.invalidate();
                    } catch (Exception ignored) {}
                    return Optional.empty();
                }

                return Optional.of(sessionUser);
            }
        }
        return Optional.empty();
    }

    public static User requireUser(HttpServletRequest request) {
        return getCurrentUser(request)
                .orElseThrow(() -> new UnauthorizedException("Authentication required. Please log in."));
    }

    public static User requireRole(HttpServletRequest request, Role... allowedRoles) {
        User user = requireUser(request);
        boolean permitted = Arrays.stream(allowedRoles).anyMatch(r -> r == user.getRole());
        if (!permitted) {
            throw new ForbiddenException("Access denied: You do not possess the required role (" + Arrays.toString(allowedRoles) + ").");
        }
        return user;
    }

    public static void setSessionUser(HttpServletRequest request, User user) {
        // Establish or retrieve session FIRST: changeSessionId() requires an existing session
        HttpSession session = request.getSession(true);
        // Session fixation protection: Rotate the session ID upon authentication (Jakarta Servlet 6.0 / 3.1+)
        try {
            request.changeSessionId();
        } catch (Exception | NoSuchMethodError e) {
            LOGGER.error("Session fixation defense failed: unable to rotate session ID", e);
            throw new SecurityException("Session ID rotation failed; login aborted for security.", e);
        }
        session.setAttribute(SESSION_USER_KEY, user);
    }

    public static void invalidateSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }
}
