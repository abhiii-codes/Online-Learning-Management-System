package com.lms.dao.impl;

import com.lms.config.DatabaseConfig;
import com.lms.dao.SystemSettingDao;
import com.lms.exception.DatabaseOperationException;
import com.lms.model.SystemSetting;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class SystemSettingDaoImpl implements SystemSettingDao {

    @Override
    public String getSetting(String key, String defaultValue) {
        String sql = "SELECT setting_value FROM system_settings WHERE setting_key = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, key);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getString("setting_value");
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to read system setting: " + key, e);
        }
        return defaultValue;
    }

    @Override
    public boolean setSetting(String key, String value, String description) {
        String checkSql = "SELECT COUNT(*) FROM system_settings WHERE setting_key = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
            checkStmt.setString(1, key);
            boolean exists = false;
            try (ResultSet rs = checkStmt.executeQuery()) {
                if (rs.next() && rs.getInt(1) > 0) {
                    exists = true;
                }
            }

            if (exists) {
                String updateSql = "UPDATE system_settings SET setting_value = ?, description = ? WHERE setting_key = ?";
                try (PreparedStatement updateStmt = conn.prepareStatement(updateSql)) {
                    updateStmt.setString(1, value);
                    updateStmt.setString(2, description);
                    updateStmt.setString(3, key);
                    return updateStmt.executeUpdate() > 0;
                }
            } else {
                String insertSql = "INSERT INTO system_settings (setting_key, setting_value, description) VALUES (?, ?, ?)";
                try (PreparedStatement insertStmt = conn.prepareStatement(insertSql)) {
                    insertStmt.setString(1, key);
                    insertStmt.setString(2, value);
                    insertStmt.setString(3, description);
                    return insertStmt.executeUpdate() > 0;
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to update system setting: " + key, e);
        }
    }

    @Override
    public List<SystemSetting> getAllSettings() {
        String sql = "SELECT setting_key, setting_value, description FROM system_settings ORDER BY setting_key ASC";
        List<SystemSetting> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                list.add(new SystemSetting(
                        rs.getString("setting_key"),
                        rs.getString("setting_value"),
                        rs.getString("description")
                ));
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to list system settings", e);
        }
        return list;
    }
}
