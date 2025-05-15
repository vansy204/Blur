package com.blur.notificationservice.service;

import com.blur.notificationservice.entity.Notification;
import com.blur.notificationservice.repository.NotificationRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)

public class NotificationService {
    NotificationRepository notificationRepository;

    public void save(Notification notification){
        notificationRepository.save(notification);
    }
    public List<Notification> getForUser(String receiverId){
        return notificationRepository.findByReceiverIdOrderByTimestampDesc(receiverId);
    }
}
