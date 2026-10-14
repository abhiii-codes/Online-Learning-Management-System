package com.lms.dao;

import com.lms.model.AuditLog;

import java.sql.Connection;
import java.util.List;

public interface AuditLogDao {

    AuditLog create(AuditLog log);

    AuditLog create(Connection conn, AuditLog log);

    List<AuditLog> findRecent(int limit);
}
