package com.blur.notificationservice.controller;

import com.blur.event.dto.NotificationEvent;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;


@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationController {
    //config kafka
    @KafkaListener(topics = "notification-delivery",groupId = "${spring.kafka.consumer.group-id}")
    public void listenNotificationDelivery(NotificationEvent message){
        log.info("Message receiver: {}",message);
    }

}
