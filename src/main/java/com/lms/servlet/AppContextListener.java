package com.lms.servlet;

import com.lms.config.DatabaseConfig;
import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * ServletContextListener that initializes the application database connection pool
 * on Tomcat startup and cleanly releases all pool resources and threads on context teardown.
 * Prevents memory and connection pool leaks during servlet container redeployment.
 */
@WebListener
public class AppContextListener implements ServletContextListener {

    private static final Logger LOGGER = LoggerFactory.getLogger(AppContextListener.class);

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        LOGGER.info("AppContextListener: Initializing LMS application context and HikariCP connection pool...");
        try {
            DatabaseConfig.initialize();
            LOGGER.info("AppContextListener: Database pool successfully initialized: {}", DatabaseConfig.getActiveDatabaseType());
        } catch (Exception e) {
            LOGGER.error("AppContextListener: CRITICAL: Failed to initialize database on startup", e);
            throw new RuntimeException("Application deployment aborted: Database connection pool failed to initialize", e);
        }
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        LOGGER.info("AppContextListener: Destroying LMS application context and shutting down HikariCP pool...");
        try {
            DatabaseConfig.shutdown();
            LOGGER.info("AppContextListener: HikariCP connection pool shutdown complete.");
        } catch (Exception e) {
            LOGGER.error("AppContextListener: Error during pool shutdown", e);
        }
    }
}
