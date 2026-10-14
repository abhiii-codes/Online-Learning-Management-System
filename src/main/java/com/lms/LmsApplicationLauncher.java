package com.lms;

import com.lms.config.DatabaseConfig;
import com.lms.filter.CorsFilter;
import com.lms.filter.EncodingFilter;
import com.lms.servlet.*;
import org.apache.catalina.Context;
import org.apache.catalina.LifecycleException;
import org.apache.catalina.servlets.DefaultServlet;
import org.apache.catalina.startup.Tomcat;
import org.apache.tomcat.util.descriptor.web.FilterDef;
import org.apache.tomcat.util.descriptor.web.FilterMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;

/**
 * Embedded Apache Tomcat 10.1 Launcher.
 * Provides one-click execution for testing, academic evaluation, and local demo.
 * Serves both the compiled React frontend SPA and genuine Jakarta Servlet backend.
 */
public class LmsApplicationLauncher {

    private static final Logger LOGGER = LoggerFactory.getLogger(LmsApplicationLauncher.class);
    private static final int DEFAULT_PORT = 8080;

    public static void main(String[] args) throws LifecycleException {
        int port = DEFAULT_PORT;
        String portEnv = System.getenv("PORT");
        if (portEnv != null && !portEnv.isBlank()) {
            try {
                port = Integer.parseInt(portEnv.trim());
            } catch (NumberFormatException ignored) {}
        }

        LOGGER.info("==================================================================");
        LOGGER.info("Starting ONLINE LEARNING MANAGEMENT SYSTEM (LMS)");
        LOGGER.info("3rd-Semester CSE Java Web-Based Project (Rubric: 33 Marks)");
        LOGGER.info("Jakarta Servlet 6.0 | Apache Tomcat 10.1 | HikariCP | JDBC");
        LOGGER.info("==================================================================");

        // 1. Initialize Database & HikariCP Pool
        DatabaseConfig.initialize();
        LOGGER.info("Active Database Engine: {}", DatabaseConfig.getActiveDatabaseType());

        // 2. Configure Embedded Tomcat
        Tomcat tomcat = new Tomcat();
        tomcat.setPort(port);
        tomcat.setBaseDir("target/tomcat");
        tomcat.getConnector(); // Initialize HTTP connector

        // Webapp document base directory
        File docBase = new File("src/main/webapp");
        if (!docBase.exists()) {
            docBase = new File("webapp");
        }
        if (!docBase.exists()) {
            docBase.mkdirs();
        }

        Context ctx = tomcat.addContext("", docBase.getAbsolutePath());

        // Configure default MIME type mappings for single-page app static assets
        ctx.addMimeMapping("js", "text/javascript");
        ctx.addMimeMapping("mjs", "text/javascript");
        ctx.addMimeMapping("css", "text/css");
        ctx.addMimeMapping("html", "text/html");
        ctx.addMimeMapping("svg", "image/svg+xml");
        ctx.addMimeMapping("json", "application/json");
        ctx.addMimeMapping("png", "image/png");
        ctx.addMimeMapping("ico", "image/x-icon");

        // Configure default welcome file for root URL (/)
        ctx.addWelcomeFile("index.html");

        // 3. Default Servlet for Static Single-Page App Assets (HTML, CSS, JS)
        Tomcat.addServlet(ctx, "default", new DefaultServlet());
        ctx.addServletMappingDecoded("/", "default");
        ctx.addServletMappingDecoded("/index.html", "default");
        ctx.addServletMappingDecoded("/assets/*", "default");

        // 4. Register Filters directly using filter instances
        registerFilter(ctx, "EncodingFilter", new EncodingFilter(), "/*");
        registerFilter(ctx, "CorsFilter", new CorsFilter(), "/*");

        // 5. Register Jakarta Servlets explicitly (mapping both base URL and wildcards)
        registerServlet(ctx, "AuthServlet", new AuthServlet(), "/api/auth", "/api/auth/*");
        registerServlet(ctx, "UserServlet", new UserServlet(), "/api/users", "/api/users/*");
        registerServlet(ctx, "CourseServlet", new CourseServlet(), "/api/courses", "/api/courses/*");
        registerServlet(ctx, "ModuleServlet", new ModuleServlet(), "/api/modules", "/api/modules/*");
        registerServlet(ctx, "LessonServlet", new LessonServlet(), "/api/lessons", "/api/lessons/*");
        registerServlet(ctx, "EnrollmentServlet", new EnrollmentServlet(), "/api/enrollments", "/api/enrollments/*");
        registerServlet(ctx, "AssignmentServlet", new AssignmentServlet(), "/api/assignments", "/api/assignments/*");
        registerServlet(ctx, "SubmissionServlet", new SubmissionServlet(), "/api/submissions", "/api/submissions/*");
        registerServlet(ctx, "QuizServlet", new QuizServlet(), "/api/quizzes", "/api/quizzes/*");
        registerServlet(ctx, "ProgressServlet", new ProgressServlet(), "/api/progress", "/api/progress/*");
        registerServlet(ctx, "NotificationServlet", new NotificationServlet(), "/api/notifications", "/api/notifications/*");
        registerServlet(ctx, "AnalyticsServlet", new AnalyticsServlet(), "/api/analytics", "/api/analytics/*");
        registerServlet(ctx, "AuditLogServlet", new AuditLogServlet(), "/api/audit-logs", "/api/audit-logs/*");
        registerServlet(ctx, "SystemSettingServlet", new SystemSettingServlet(), "/api/settings", "/api/settings/*");

        // 6. Start Tomcat Engine
        tomcat.start();
        LOGGER.info("==================================================================");
        LOGGER.info("LMS Server successfully listening at: http://localhost:{}", port);
        LOGGER.info("Frontend Single-Page App: http://localhost:{}/", port);
        LOGGER.info("Jakarta Servlet API: http://localhost:{}/api/*", port);
        LOGGER.info("==================================================================");

        tomcat.getServer().await();
    }

    private static void registerFilter(Context ctx, String name, jakarta.servlet.Filter filter, String urlPattern) {
        FilterDef def = new FilterDef();
        def.setFilterName(name);
        def.setFilter(filter);
        ctx.addFilterDef(def);

        FilterMap map = new FilterMap();
        map.setFilterName(name);
        map.addURLPattern(urlPattern);
        ctx.addFilterMap(map);
    }

    private static void registerServlet(Context ctx, String name, jakarta.servlet.Servlet servlet, String... urlPatterns) {
        Tomcat.addServlet(ctx, name, servlet);
        for (String pattern : urlPatterns) {
            ctx.addServletMappingDecoded(pattern, name);
        }
    }
}
