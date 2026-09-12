package com.vighnesh.controller;

import com.vighnesh.model.Notification;
import com.vighnesh.model.User;
import com.vighnesh.request.NotificationCreateRequest;
import com.vighnesh.response.MessageResponse;
import com.vighnesh.service.NotificationService;
import com.vighnesh.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<Notification>> listNotifications(@RequestHeader("Authorization") String jwt) throws Exception{
        User user = userService.findUserByJwtToken(jwt);
        List<Notification> notifications = notificationService.listForUser(user.getId());
        return new ResponseEntity<>(notifications, HttpStatus.OK);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markRead(@PathVariable Long id, @RequestHeader("Authorization") String jwt) throws Exception{
        User user = userService.findUserByJwtToken(jwt);
        Notification updated = notificationService.markRead(id, user.getId());
        return new ResponseEntity<>(updated, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteNotification(@PathVariable Long id, @RequestHeader("Authorization") String jwt) throws Exception{
        User user = userService.findUserByJwtToken(jwt);
        notificationService.delete(id, user.getId());
        MessageResponse res = new MessageResponse();
        res.setMessage("notification deleted");
        return new ResponseEntity<>(res, HttpStatus.OK);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> unreadCount(@RequestHeader("Authorization") String jwt) throws Exception{
        User user = userService.findUserByJwtToken(jwt);
        long count = notificationService.getUnreadCount(user.getId());
        return new ResponseEntity<>(count, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<Notification> createNotification(@RequestBody NotificationCreateRequest req,
                                                           @RequestHeader("Authorization") String jwt) throws Exception{
        User user = userService.findUserByJwtToken(jwt);
        Notification created = notificationService.createNotificationForUser(
                user,
                req.getTitle(),
                req.getBody(),
                req.getType(),
                req.getData()
        );
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }
}
