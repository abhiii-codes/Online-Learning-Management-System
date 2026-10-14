package com.lms.dao;

import com.lms.model.SystemSetting;

import java.util.List;

public interface SystemSettingDao {

    String getSetting(String key, String defaultValue);

    boolean setSetting(String key, String value, String description);

    List<SystemSetting> getAllSettings();
}
