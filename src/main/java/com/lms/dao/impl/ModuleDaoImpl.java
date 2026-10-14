package com.lms.dao.impl;

import com.lms.config.DatabaseConfig;
import com.lms.dao.ModuleDao;
import com.lms.exception.DatabaseOperationException;
import com.lms.model.Module;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class ModuleDaoImpl implements ModuleDao {

    @Override
    public List<Module> findByCourseId(Long courseId) {
        String sql = "SELECT id, course_id, title, description, order_index, created_at FROM modules " +
                     "WHERE course_id = ? ORDER BY order_index ASC, id ASC";
        List<Module> list = new ArrayList<>();
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, courseId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to fetch modules for course: " + courseId, e);
        }
        return list;
    }

    @Override
    public Optional<Module> findById(Long id) {
        String sql = "SELECT id, course_id, title, description, order_index, created_at FROM modules WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRow(rs));
                }
            }
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to query module by id: " + id, e);
        }
        return Optional.empty();
    }

    @Override
    public Module create(Module module) {
        String sql = "INSERT INTO modules (course_id, title, description, order_index) VALUES (?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setLong(1, module.getCourseId());
            stmt.setString(2, module.getTitle());
            stmt.setString(3, module.getDescription());
            stmt.setInt(4, module.getOrderIndex());

            stmt.executeUpdate();
            try (ResultSet keys = stmt.getGeneratedKeys()) {
                if (keys.next()) {
                    module.setId(keys.getLong(1));
                }
            }
            return module;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database error creating module: " + module.getTitle(), e);
        }
    }

    @Override
    public boolean update(Module module) {
        String sql = "UPDATE modules SET title = ?, description = ?, order_index = ? WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, module.getTitle());
            stmt.setString(2, module.getDescription());
            stmt.setInt(3, module.getOrderIndex());
            stmt.setLong(4, module.getId());
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Database error updating module: " + module.getId(), e);
        }
    }

    @Override
    public boolean delete(Long id) {
        String sql = "DELETE FROM modules WHERE id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseOperationException("Failed to delete module: " + id, e);
        }
    }

    private Module mapRow(ResultSet rs) throws SQLException {
        Module m = new Module();
        m.setId(rs.getLong("id"));
        m.setCourseId(rs.getLong("course_id"));
        m.setTitle(rs.getString("title"));
        m.setDescription(rs.getString("description"));
        m.setOrderIndex(rs.getInt("order_index"));
        Timestamp ts = rs.getTimestamp("created_at");
        if (ts != null) {
            m.setCreatedAt(ts.toLocalDateTime());
        }
        return m;
    }
}
