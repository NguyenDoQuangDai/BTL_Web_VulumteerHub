package org.volumteerhub.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.volumteerhub.common.enumeration.UserRole;
import org.volumteerhub.model.Event;
import org.volumteerhub.model.User;
import org.volumteerhub.repository.UserRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationDispatcherService {

    private final UserRepository userRepository;
    private final WebPushService webPushService;

    public void sendToUsers(List<User> users, String title, String body) {
        sendToUsers(users, title, body, null);
    }

    public void sendToUsers(List<User> users, String title, String body, String url) {
        for (User user : users) {
            try {
                webPushService.sendNotificationToUser(user, title, body, url);
                log.info("Dispatching notifications to {} users: {}", users.size(), title);
            } catch (Exception e) {
                log.error("Failed to send notification to user {}: {}", user.getUsername(), e.getMessage());
            }
        }
    }

    public void notifyAllAdmins (String title, String body) {
        List<User> admins = userRepository.findByRole(UserRole.ADMIN);
        this.sendToUsers(admins, title, body);
    }

    public void notifyEventOwner (Event event, String title, String body, String url) {
        User owner = event.getOwner();
        webPushService.sendNotificationToUser(owner, title, body, url);
    }
}
