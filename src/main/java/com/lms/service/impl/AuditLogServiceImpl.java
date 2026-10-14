package com.lms.service.impl;

import com.lms.dao.AuditLogDao;
import com.lms.model.AuditLog;
import com.lms.service.AuditLogService;

import java.util.List;

public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogDao auditLogDao;

    public AuditLogServiceImpl(AuditLogDao auditLogDao) {
        this.auditLogDao = auditLogDao;
    }

    @Override
    public List<AuditLog> getRecentLogs(int limit) {
        return auditLogDao.findRecent(limit);
    }

    @Override
    public void log(Long userId, String action, String entityName, Long entityId, String details, String ipAddress) {
        auditLogDao.create(new AuditLog(userId, action, entityName, entityId, details, ipAddress));
    }
}
