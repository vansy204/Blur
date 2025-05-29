package com.blur.notificationservice.repository;

import com.blur.notificationservice.entity.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByReceiverIdOrderByTimestampDesc(String receiverId);
    List<Notification> findAllByReceiverId(String receiverId);
}
