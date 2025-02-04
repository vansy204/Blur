package com.blur.notificationservice.controller;

import com.blur.event.dto.NotificationEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;


@Component
@Slf4j
public class NotificationController {
    //config kafka
    @KafkaListener(topics = "notification-delivery",groupId = "${spring.kafka.consumer.group-id}")
    public void listenNotificationDelivery(NotificationEvent message){
        log.info("Message receiver: {}",message);
    }

}
