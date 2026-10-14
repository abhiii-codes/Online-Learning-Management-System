package com.lms.service;

import com.lms.model.AuditLog;

import java.util.List;

public interface AuditLogService {

    List<AuditLog> getRecentLogs(int limit);

    void log(Long userId, String action, String entityName, Long entityId, String details, String ipAddress);
}
