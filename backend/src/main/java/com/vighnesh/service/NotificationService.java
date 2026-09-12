package com.vighnesh.service;

import com.vighnesh.model.Notification;
import com.vighnesh.model.User;

import java.util.List;

public interface NotificationService {
    Notification createNotificationForUser(User user, String title, String body, String type, String data);
    List<Notification> listForUser(Long userId);
    Notification markRead(Long id, Long userId) throws Exception;
    void delete(Long id, Long userId) throws Exception;
    long getUnreadCount(Long userId);
}

