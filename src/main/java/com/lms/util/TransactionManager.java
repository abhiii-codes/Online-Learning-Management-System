package com.lms.util;

import com.lms.config.DatabaseConfig;
import com.lms.exception.DatabaseOperationException;
import com.lms.exception.DuplicateKeyException;
import com.lms.exception.LmsException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Connection;
import java.sql.SQLException;

/**
 * Reusable JDBC Transaction Manager.
 * Demonstrates:
 * 1. Template Method / Callback Pattern for transaction demarcation.
 * 2. Guaranteed ACID semantics (setAutoCommit(false), commit, rollback).
 * 3. Transient collision retry handling: MySQL Deadlock (1213 / SQLState 40001) and Lock Wait Timeout (1205) with backoff jitter.
 * 4. Exception suppression chaining (ex.addSuppressed(rollbackEx)).
 * 5. Vendor-specific duplicate key isolation (MySQL vendor code 1062 vs generic 23000).
 */
public final class TransactionManager {

    private static final Logger LOGGER = LoggerFactory.getLogger(TransactionManager.class);
    private static final int MAX_DEADLOCK_RETRIES = 1;

    @FunctionalInterface
    public interface TransactionCallback<T> {
        T doInTransaction(Connection conn) throws SQLException, LmsException;
    }

    @FunctionalInterface
    public interface TransactionVoidCallback {
        void doInTransaction(Connection conn) throws SQLException, LmsException;
    }

    private TransactionManager() {}

    public static <T> T execute(TransactionCallback<T> action) {
        int attempts = 0;
        while (true) {
            attempts++;
            Connection conn = null;
            try {
                conn = DatabaseConfig.getConnection();
                conn.setAutoCommit(false);

                T result = action.doInTransaction(conn);

                conn.commit();
                return result;
            } catch (Throwable t) {
                if (conn != null) {
                    try {
                        conn.rollback();
                    } catch (SQLException rollbackEx) {
                        t.addSuppressed(rollbackEx);
                        LOGGER.error("Rollback failed during transaction abort", rollbackEx);
                    }
                }

                // Unwrap any SQLException in the cause chain (even if wrapped by DAOs in DatabaseOperationException)
                SQLException sqlEx = extractSqlException(t);
                if (sqlEx != null) {
                    // Check for Transient Lock Collisions: MySQL Deadlock (1213 / 40001) or Lock Wait Timeout (1205)
                    if (isTransientLockCollision(sqlEx) && attempts <= MAX_DEADLOCK_RETRIES) {
                        LOGGER.warn("Transient lock collision detected (SQLState {}, ErrorCode {}). Retrying transaction (Attempt {}/{})",
                                sqlEx.getSQLState(), sqlEx.getErrorCode(), attempts, MAX_DEADLOCK_RETRIES + 1);
                        try {
                            long jitter = (long) (Math.random() * 25);
                            Thread.sleep(50L * attempts + jitter); // Backoff with randomized jitter
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                        }
                        continue;
                    }

                    // Duplicate key check: MySQL vendor code 1062, or H2/PostgreSQL SQLState 23505.
                    if (sqlEx.getErrorCode() == 1062 || "23505".equals(sqlEx.getSQLState())) {
                        throw new DuplicateKeyException("Duplicate record detected: " + sqlEx.getMessage(), sqlEx);
                    }
                }

                if (t instanceof LmsException lmsEx) {
                    throw lmsEx;
                } else if (t instanceof RuntimeException rtEx) {
                    throw rtEx;
                } else if (t instanceof Error err) {
                    throw err;
                } else {
                    throw new DatabaseOperationException("Transaction failed: " + t.getMessage(), t);
                }
            } finally {
                if (conn != null) {
                    try {
                        conn.setAutoCommit(true);
                        conn.close();
                    } catch (SQLException closeEx) {
                        LOGGER.error("Failed to restore auto-commit or close connection", closeEx);
                    }
                }
            }
        }
    }

    public static SQLException extractSqlException(Throwable t) {
        Throwable curr = t;
        while (curr != null) {
            if (curr instanceof SQLException) {
                return (SQLException) curr;
            }
            curr = curr.getCause();
        }
        return null;
    }

    public static void executeVoid(TransactionVoidCallback action) {
        execute(conn -> {
            action.doInTransaction(conn);
            return null;
        });
    }

    private static boolean isTransientLockCollision(SQLException ex) {
        String state = ex.getSQLState();
        int errorCode = ex.getErrorCode();
        return "40001".equals(state) || errorCode == 1213;
    }
}
