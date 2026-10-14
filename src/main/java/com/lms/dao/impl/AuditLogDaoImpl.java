package com.lms.dao.impl;

import com.lms.config.DatabaseConfig;
import com.lms.dao.AuditLogDao;
import com.lms.exception.DatabaseOperationException;
import com.lms.model.AuditLog;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class AuditLogDaoImpl implements AuditLogDao {

    @Override
    public AuditLog create(AuditLog log) {
        try (Connection conn = DatabaseConfig.getConnection()) {
            return create(conn, log);
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to persist audit log", e);
        }
    }

    @Override
    public AuditLog create(Connection conn, AuditLog log) {
        String sql = "INSERT INTO audit_logs (user_id, action, entity_name, entity_id, details, ip_address) " +
                     "VALUES (?, ?, ?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            if (log.getUserId() != null) {
                stmt.setLong(1, log.getUserId());
            } else {
                stmt.setNull(1, Types.BIGINT);
            }
            stmt.setString(2, log.getAction());
            stmt.setString(3, log.getEntityName());
            if (log.getEntityId() != null) {
                stmt.setLong(4, log.getEntityId());
            } else {
                stmt.setNull(4, Types.BIGINT);
            }
            stmt.setString(5, log.getDetails());
            stmt.setString(6, log.getIpAddress());

            stmt.executeUpdate();
            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    log.setId(keys.getLong(1));
                }
            }
            return log;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database error logging audit event", e);
        }
    }

    @Override
    public List<AuditLog> findRecent(int limit) {
        String sql = "SELECT al.id, al.user_id, al.action, al.entity_name, al.entity_id, al.details, al.ip_address, al.timestamp, " +
                     "u.name AS user_name " +
                     "FROM audit_logs al " +
                     "LEFT JOIN users u ON al.user_id = u.id " +
                     "ORDER BY al.timestamp DESC LIMIT ?";
        List<AuditLog> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, limit);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    AuditLog log = new AuditLog();
                    log.setId(rs.getLong("id"));
                    long uid = rs.getLong("user_id");
                    if (!rs.wasNull()) {
                        log.setUserId(uid);
                    }
                    log.setUserName(rs.getString("user_name"));
                    log.setAction(rs.getString("action"));
                    log.setEntityName(rs.getString("entity_name"));
                    long eid = rs.getLong("entity_id");
                    if (!rs.wasNull()) {
                        log.setEntityId(eid);
                    }
                    log.setDetails(rs.getString("details"));
                    log.setIpAddress(rs.getString("ip_address"));
                    Timestamp ts = rs.getTimestamp("timestamp");
                    if (ts != null) {
                        log.setTimestamp(ts.toLocalDateTime());
                    }
                    list.add(log);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to fetch recent audit logs", e);
        }
        return list;
    }
}
