package com.vighnesh.service;

import com.vighnesh.model.Notification;
import com.vighnesh.model.User;
import com.vighnesh.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class NotificationServiceImp implements NotificationService{

    @Autowired
    private NotificationRepository notificationRepository;

    @Override
    public Notification createNotificationForUser(User user, String title, String body, String type, String data) {
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setBody(body);
        n.setType(type);
        n.setData(data);
        n.setRead(false);
        return notificationRepository.save(n);
    }

    @Override
    public List<Notification> listForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public Notification markRead(Long id, Long userId) throws Exception {
        Optional<com.vighnesh.model.Notification> opt = notificationRepository.findByIdAndUserId(id, userId);
        if(opt.isEmpty()) throw new Exception("notification not found");
        Notification n = opt.get();
        n.setRead(true);
        return notificationRepository.save(n);
    }

    @Override
    public void delete(Long id, Long userId) throws Exception {
        Optional<Notification> opt = notificationRepository.findByIdAndUserId(id, userId);
        if(opt.isEmpty()) throw new Exception("notification not found");
        notificationRepository.deleteById(id);
    }

    @Override
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }
}
