package com.lms;

import com.lms.config.DatabaseConfig;
import com.lms.servlet.AuthServlet;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.WriteListener;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("Jakarta Servlet Request Handling & Session Management Test Suite (7 Marks Rubric Coverage)")
public class ServletRequestHandlingTest {

    @BeforeAll
    static void init() {
        DatabaseConfig.initialize();
    }

    @Test
    @DisplayName("1. AuthServlet: Valid credentials authenticate, establish session, and return JSON")
    void testAuthServletLoginSuccess() throws Exception {
        AuthServlet servlet = new AuthServlet();

        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse resp = mock(HttpServletResponse.class);
        HttpSession session = mock(HttpSession.class);

        when(req.getMethod()).thenReturn("POST");
        when(req.getPathInfo()).thenReturn("/login");
        when(req.getSession(true)).thenReturn(session);

        String jsonPayload = "{\"email\":\"ada@lms.edu\",\"password\":\"password123\"}";
        ByteArrayInputStream in = new ByteArrayInputStream(jsonPayload.getBytes(StandardCharsets.UTF_8));
        when(req.getInputStream()).thenReturn(new DelegatingServletInputStream(in));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        when(resp.getOutputStream()).thenReturn(new DelegatingServletOutputStream(out));

        servlet.service(req, resp);

        // Verify session was populated with authenticated user
        verify(session, atLeastOnce()).setAttribute(eq("currentUser"), any());

        String jsonResponse = out.toString(StandardCharsets.UTF_8);
        assertTrue(jsonResponse.contains("\"success\":true"), "Response must indicate success");
        assertTrue(jsonResponse.contains("Prof. Ada Lovelace"), "Response must contain user profile");
    }

    @Test
    @DisplayName("2. AuthServlet: Invalid password returns 401 Unauthorized with consistent JSON error")
    void testAuthServletLoginFailure() throws Exception {
        AuthServlet servlet = new AuthServlet();

        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse resp = mock(HttpServletResponse.class);

        when(req.getMethod()).thenReturn("POST");
        when(req.getPathInfo()).thenReturn("/login");

        String jsonPayload = "{\"email\":\"ada@lms.edu\",\"password\":\"wrongpassword\"}";
        ByteArrayInputStream in = new ByteArrayInputStream(jsonPayload.getBytes(StandardCharsets.UTF_8));
        when(req.getInputStream()).thenReturn(new DelegatingServletInputStream(in));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        when(resp.getOutputStream()).thenReturn(new DelegatingServletOutputStream(out));

        servlet.service(req, resp);

        verify(resp).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        String jsonResponse = out.toString(StandardCharsets.UTF_8);
        assertTrue(jsonResponse.contains("\"success\":false"));
        assertTrue(jsonResponse.contains("Invalid email or password"));
    }

    @Test
    @DisplayName("3. AuthFilter: Unauthenticated request to protected endpoint returns 401 Unauthorized")
    void testAuthFilterBlocksUnauthenticatedProtectedEndpoint() throws Exception {
        com.lms.filter.AuthFilter filter = new com.lms.filter.AuthFilter();
        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse resp = mock(HttpServletResponse.class);
        jakarta.servlet.FilterChain chain = mock(jakarta.servlet.FilterChain.class);

        when(req.getServletPath()).thenReturn("/api/enrollments");
        when(req.getPathInfo()).thenReturn("/my");
        when(req.getMethod()).thenReturn("GET");
        when(req.getSession(false)).thenReturn(null);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        when(resp.getOutputStream()).thenReturn(new DelegatingServletOutputStream(out));

        filter.doFilter(req, resp, chain);

        verify(resp).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        verify(chain, never()).doFilter(any(), any());
        assertTrue(out.toString(StandardCharsets.UTF_8).contains("Authentication required"));
    }

    @Test
    @DisplayName("4. AuthFilter: Substring bypass attempt (/api/enrollments/drop/api/auth/login) is blocked with 401")
    void testAuthFilterPreventsSubstringBypass() throws Exception {
        com.lms.filter.AuthFilter filter = new com.lms.filter.AuthFilter();
        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse resp = mock(HttpServletResponse.class);
        jakarta.servlet.FilterChain chain = mock(jakarta.servlet.FilterChain.class);

        when(req.getServletPath()).thenReturn("/api/enrollments");
        when(req.getPathInfo()).thenReturn("/drop/api/auth/login");
        when(req.getMethod()).thenReturn("POST");
        when(req.getSession(false)).thenReturn(null);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        when(resp.getOutputStream()).thenReturn(new DelegatingServletOutputStream(out));

        filter.doFilter(req, resp, chain);

        verify(resp).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        verify(chain, never()).doFilter(any(), any());
    }

    @Test
    @DisplayName("5. AuthFilter: Exact public auth route (/api/auth/login) is permitted without authentication")
    void testAuthFilterPermitsPublicAuthEndpoint() throws Exception {
        com.lms.filter.AuthFilter filter = new com.lms.filter.AuthFilter();
        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse resp = mock(HttpServletResponse.class);
        jakarta.servlet.FilterChain chain = mock(jakarta.servlet.FilterChain.class);

        when(req.getServletPath()).thenReturn("/api/auth/login");
        when(req.getPathInfo()).thenReturn(null);
        when(req.getMethod()).thenReturn("POST");

        filter.doFilter(req, resp, chain);

        verify(chain).doFilter(req, resp);
        verify(resp, never()).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    }

    @Test
    @DisplayName("6. AuthFilter: Polymorphic role enforcement blocks non-admin student accessing /api/audit-logs with 403")
    void testAuthFilterRoleEnforcementBlocksNonAdmin() throws Exception {
        com.lms.filter.AuthFilter filter = new com.lms.filter.AuthFilter();
        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse resp = mock(HttpServletResponse.class);
        HttpSession session = mock(HttpSession.class);
        jakarta.servlet.FilterChain chain = mock(jakarta.servlet.FilterChain.class);

        com.lms.model.StudentUser student = new com.lms.model.StudentUser(
                1L, "Student", "student@lms.edu", "hash", "Bio", com.lms.model.UserStatus.ACTIVE);
        when(req.getServletPath()).thenReturn("/api/audit-logs");
        when(req.getPathInfo()).thenReturn(null);
        when(req.getMethod()).thenReturn("GET");
        when(req.getSession(false)).thenReturn(session);
        when(session.getAttribute("currentUser")).thenReturn(student);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        when(resp.getOutputStream()).thenReturn(new DelegatingServletOutputStream(out));

        filter.doFilter(req, resp, chain);

        verify(resp).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(chain, never()).doFilter(any(), any());
        assertTrue(out.toString(StandardCharsets.UTF_8).contains("Administrator privileges required"));
    }

    @Test
    @DisplayName("7. BaseServlet: Centralized error handling maps domain exceptions to RFC HTTP status codes")
    void testBaseServletCentralizedExceptionMapping() throws Exception {
        com.lms.servlet.BaseServlet testServlet = new com.lms.servlet.BaseServlet() {
            @Override
            protected void doGet(HttpServletRequest req, HttpServletResponse resp) {
                String errorType = req.getParameter("error");
                if ("validation".equals(errorType)) {
                    throw new com.lms.exception.ValidationException("Invalid course name");
                } else if ("full".equals(errorType)) {
                    throw new com.lms.exception.CourseFullException(10L, 5);
                } else if ("forbidden".equals(errorType)) {
                    throw new com.lms.exception.ForbiddenException("Access denied");
                } else if ("notfound".equals(errorType)) {
                    throw new com.lms.exception.ResourceNotFoundException("Course", 999L);
                }
            }
        };

        // Sub-test A: ValidationException -> 400
        HttpServletRequest req1 = mock(HttpServletRequest.class);
        HttpServletResponse resp1 = mock(HttpServletResponse.class);
        ByteArrayOutputStream out1 = new ByteArrayOutputStream();
        when(req1.getMethod()).thenReturn("GET");
        when(req1.getParameter("error")).thenReturn("validation");
        when(resp1.getOutputStream()).thenReturn(new DelegatingServletOutputStream(out1));
        testServlet.service(req1, resp1);
        verify(resp1).setStatus(HttpServletResponse.SC_BAD_REQUEST);

        // Sub-test B: CourseFullException -> 409
        HttpServletRequest req2 = mock(HttpServletRequest.class);
        HttpServletResponse resp2 = mock(HttpServletResponse.class);
        ByteArrayOutputStream out2 = new ByteArrayOutputStream();
        when(req2.getMethod()).thenReturn("GET");
        when(req2.getParameter("error")).thenReturn("full");
        when(resp2.getOutputStream()).thenReturn(new DelegatingServletOutputStream(out2));
        testServlet.service(req2, resp2);
        verify(resp2).setStatus(HttpServletResponse.SC_CONFLICT);

        // Sub-test C: ForbiddenException -> 403
        HttpServletRequest req3 = mock(HttpServletRequest.class);
        HttpServletResponse resp3 = mock(HttpServletResponse.class);
        ByteArrayOutputStream out3 = new ByteArrayOutputStream();
        when(req3.getMethod()).thenReturn("GET");
        when(req3.getParameter("error")).thenReturn("forbidden");
        when(resp3.getOutputStream()).thenReturn(new DelegatingServletOutputStream(out3));
        testServlet.service(req3, resp3);
        verify(resp3).setStatus(HttpServletResponse.SC_FORBIDDEN);

        // Sub-test D: ResourceNotFoundException -> 404
        HttpServletRequest req4 = mock(HttpServletRequest.class);
        HttpServletResponse resp4 = mock(HttpServletResponse.class);
        ByteArrayOutputStream out4 = new ByteArrayOutputStream();
        when(req4.getMethod()).thenReturn("GET");
        when(req4.getParameter("error")).thenReturn("notfound");
        when(resp4.getOutputStream()).thenReturn(new DelegatingServletOutputStream(out4));
        testServlet.service(req4, resp4);
        verify(resp4).setStatus(HttpServletResponse.SC_NOT_FOUND);
    }

    @Test
    @DisplayName("8. BaseServlet: State-changing POST with non-JSON Content-Type returns 415 Unsupported Media Type")
    void testBaseServletRejectsNonJsonContentTypeOnPost() throws Exception {
        com.lms.servlet.BaseServlet testServlet = new com.lms.servlet.BaseServlet() {};

        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse resp = mock(HttpServletResponse.class);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        when(req.getMethod()).thenReturn("POST");
        when(req.getContentType()).thenReturn("application/x-www-form-urlencoded");
        when(resp.getOutputStream()).thenReturn(new DelegatingServletOutputStream(out));

        testServlet.service(req, resp);

        verify(resp).setStatus(HttpServletResponse.SC_UNSUPPORTED_MEDIA_TYPE);
        assertTrue(out.toString(StandardCharsets.UTF_8).contains("Content-Type must be application/json"));
    }

    @Test
    @DisplayName("9. AuthFilter: Container-decoded path prevents percent-encoded admin bypass (/api/%75sers -> /api/users)")
    void testAuthFilterDecodedPathPreventsPercentEncodedBypass() throws Exception {
        com.lms.filter.AuthFilter filter = new com.lms.filter.AuthFilter();
        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse resp = mock(HttpServletResponse.class);
        HttpSession session = mock(HttpSession.class);
        jakarta.servlet.FilterChain chain = mock(jakarta.servlet.FilterChain.class);

        com.lms.model.StudentUser student = new com.lms.model.StudentUser(
                2L, "Attacker", "student@lms.edu", "hash", "Bio", com.lms.model.UserStatus.ACTIVE);

        // Container decodes %75 to 'u', yielding getServletPath() = /api/users
        when(req.getServletPath()).thenReturn("/api/users");
        when(req.getPathInfo()).thenReturn(null);
        when(req.getMethod()).thenReturn("GET");
        when(req.getSession(false)).thenReturn(session);
        when(session.getAttribute("currentUser")).thenReturn(student);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        when(resp.getOutputStream()).thenReturn(new DelegatingServletOutputStream(out));

        filter.doFilter(req, resp, chain);

        verify(resp).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(chain, never()).doFilter(any(), any());
    }

    @Test
    @DisplayName("10. QuizServlet: Student view returns QuizStudentDto with answer keys physically stripped (no correctOption)")
    void testStudentQuizViewStripsCorrectOption() throws Exception {
        com.lms.servlet.QuizServlet servlet = new com.lms.servlet.QuizServlet();
        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse resp = mock(HttpServletResponse.class);
        HttpSession session = mock(HttpSession.class);

        com.lms.model.StudentUser student = new com.lms.model.StudentUser(
                4L, "Grace Hopper", "grace@student.lms.edu", "hash", "Bio", com.lms.model.UserStatus.ACTIVE);

        when(req.getMethod()).thenReturn("GET");
        when(req.getPathInfo()).thenReturn("/1");
        when(req.getSession(false)).thenReturn(session);
        when(session.getAttribute("currentUser")).thenReturn(student);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        when(resp.getOutputStream()).thenReturn(new DelegatingServletOutputStream(out));

        servlet.service(req, resp);

        String json = out.toString(StandardCharsets.UTF_8);
        assertTrue(json.contains("\"success\":true"), "Response must be successful");
        assertTrue(json.contains("Core Java OOP Concepts Quiz"), "Must contain quiz title");
        assertFalse(json.contains("correctOption"), "CRITICAL: Student JSON view must NOT leak correctOption field");
        assertFalse(json.contains("\"correctOption\""), "CRITICAL: Student JSON view must NOT contain correctOption property");
    }

    @Test
    @DisplayName("11. QuizServlet: Non-enrolled student attempting quiz submission is rejected with 403 Forbidden")
    void testNonEnrolledStudentBlockedFromSubmittingQuizWith403() throws Exception {
        com.lms.servlet.QuizServlet servlet = new com.lms.servlet.QuizServlet();
        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse resp = mock(HttpServletResponse.class);
        HttpSession session = mock(HttpSession.class);

        // Student 6 (Katherine Johnson) is enrolled in Course 2, but NOT enrolled in Course 1 (Quiz 1)
        com.lms.model.StudentUser student = new com.lms.model.StudentUser(
                6L, "Katherine Johnson", "katherine@student.lms.edu", "hash", "Bio", com.lms.model.UserStatus.ACTIVE);

        when(req.getMethod()).thenReturn("POST");
        when(req.getPathInfo()).thenReturn("/1/submit");
        when(req.getContentType()).thenReturn("application/json");
        when(req.getSession(false)).thenReturn(session);
        when(session.getAttribute("currentUser")).thenReturn(student);

        String payload = "{\"answers\":{\"1\":\"B\",\"2\":\"C\"}}";
        ByteArrayInputStream in = new ByteArrayInputStream(payload.getBytes(StandardCharsets.UTF_8));
        when(req.getInputStream()).thenReturn(new DelegatingServletInputStream(in));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        when(resp.getOutputStream()).thenReturn(new DelegatingServletOutputStream(out));

        servlet.service(req, resp);

        verify(resp).setStatus(HttpServletResponse.SC_FORBIDDEN);
        String json = out.toString(StandardCharsets.UTF_8);
        assertTrue(json.contains("\"success\":false"));
        assertTrue(json.contains("ACTIVE enrollment in this course"));
    }

    @Test
    @DisplayName("12. Auth & Core Java: ConcurrentHashMap rate-limits and locks account after 5 consecutive failed logins")
    void testAuthThrottlingLocksAfter5FailedAttempts() {
        com.lms.service.AuthService authService = com.lms.config.AppContext.getAuthService();
        String throttleEmail = "throttle_test_" + System.currentTimeMillis() + "@lms.edu";

        // Register student
        authService.registerStudent("Throttle User", throttleEmail, "validPassword123");

        // 5 consecutive failed login attempts
        for (int i = 1; i <= 5; i++) {
            assertThrows(com.lms.exception.UnauthorizedException.class, () -> {
                authService.authenticate(throttleEmail, "wrongPassword" + System.nanoTime());
            });
        }

        // 6th attempt must be locked out with account locked message
        com.lms.exception.UnauthorizedException lockedEx = assertThrows(
                com.lms.exception.UnauthorizedException.class,
                () -> authService.authenticate(throttleEmail, "wrongPassword")
        );

        assertTrue(lockedEx.getMessage().contains("temporarily locked"), "Account must be temporarily locked after 5 failed attempts: " + lockedEx.getMessage());
    }

    @Test
    @DisplayName("13. AuthServlet & BaseServlet: Empty POST /api/auth/logout with Content-Length 0 succeeds with 200 OK")
    void testEmptyPostLogoutSucceedsWithout415() throws Exception {
        com.lms.servlet.AuthServlet servlet = new com.lms.servlet.AuthServlet();
        HttpServletRequest req = mock(HttpServletRequest.class);
        HttpServletResponse resp = mock(HttpServletResponse.class);
        HttpSession session = mock(HttpSession.class);

        when(req.getMethod()).thenReturn("POST");
        when(req.getPathInfo()).thenReturn("/logout");
        when(req.getContentLength()).thenReturn(0);
        when(req.getHeader("Content-Length")).thenReturn("0");
        when(req.getContentType()).thenReturn(null);
        when(req.getSession(false)).thenReturn(session);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        when(resp.getOutputStream()).thenReturn(new DelegatingServletOutputStream(out));

        servlet.service(req, resp);

        verify(resp, never()).setStatus(HttpServletResponse.SC_UNSUPPORTED_MEDIA_TYPE);
        verify(session).invalidate();
        String json = out.toString(StandardCharsets.UTF_8);
        assertTrue(json.contains("\"success\":true"), "Response must be success");
        assertTrue(json.contains("Logged out successfully"), "Response must confirm logout");
    }

    // Helper classes for simulating Servlet I/O
    static class DelegatingServletInputStream extends jakarta.servlet.ServletInputStream {
        private final ByteArrayInputStream source;

        public DelegatingServletInputStream(ByteArrayInputStream source) {
            this.source = source;
        }

        @Override public boolean isFinished() { return source.available() == 0; }
        @Override public boolean isReady() { return true; }
        @Override public void setReadListener(jakarta.servlet.ReadListener readListener) {}
        @Override public int read() { return source.read(); }
    }

    static class DelegatingServletOutputStream extends ServletOutputStream {
        private final ByteArrayOutputStream target;

        public DelegatingServletOutputStream(ByteArrayOutputStream target) {
            this.target = target;
        }

        @Override public boolean isReady() { return true; }
        @Override public void setWriteListener(WriteListener writeListener) {}
        @Override public void write(int b) { target.write(b); }
    }
}
