package com.blur.notificationservice.configuration;

import com.blur.notificationservice.dto.event.FollowEvent;
import com.blur.notificationservice.entity.Notification;
import com.blur.notificationservice.service.NotificationService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import jakarta.mail.internet.MimeMessage;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class FollowEventListener {
    RedisTemplate<String,String> redisTemplate;
    SimpMessagingTemplate simpMessagingTemplate;
    JavaMailSender emailSender;
    NotificationService notificationService;
    ObjectMapper objectMapper;


    @KafkaListener(topics = "user-follow-events",groupId = "notification-service")
    public void consume(String jsonMessage) throws JsonProcessingException {
        FollowEvent event = objectMapper.readValue(jsonMessage,FollowEvent.class);
        log.info("Received follow event: {}", event);
        event.setTimestamp(LocalDateTime.now());

        Notification notification = Notification.builder()
                .senderId(event.getSenderId())
                .senderName(event.getSenderName())
                .receiverId(event.getReceiverId())
                .receiverName(event.getReceiverName())
                .receiverEmail(event.getReceiverEmail())
                .timestamp(event.getTimestamp())
                .content(event.getSenderName() + " followed you on Blur.")
                .build();
        boolean isOnline = Boolean.TRUE.equals(redisTemplate.hasKey("online" + notification.getReceiverId()));
        notificationService.save(notification);
        sendFollowNotification(notification);
        if(isOnline){
            simpMessagingTemplate.convertAndSend("/topic/notifications",notification);
        }else{
            log.info("Sending email to {} for follow event",notification.getReceiverEmail());
        }
    }
    private void sendFollowNotification(Notification notification) {
        try {
            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(notification.getReceiverEmail());
            helper.setSubject("📢 Someone new is following you on Blur!");

            // Build a more attractive HTML email with blue color scheme
            String emailContent =
                    "<!DOCTYPE html>" +
                            "<html>" +
                            "<head>" +
                            "    <meta charset=\"UTF-8\">" +
                            "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                            "    <title>New Follower on Blur</title>" +
                            "</head>" +
                            "<body style=\"margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;\">" +
                            "    <div style=\"background-color: #f5f8fa; padding: 20px;\">" +
                            "        <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);\">" +
                            "            <!-- Header -->" +
                            "            <div style=\"background-color: #1DA1F2; padding: 30px 20px; text-align: center;\">" +
                            "                <h1 style=\"color: #ffffff; margin: 0; font-size: 24px;\">You Have a New Follower!</h1>" +
                            "            </div>" +
                            "            <!-- Content -->" +
                            "            <div style=\"padding: 30px; color: #4a4a4a;\">" +
                            "                <p style=\"font-size: 16px; margin-top: 0;\">Hi <span style=\"font-weight: bold;\">" + notification.getReceiverName() + "</span>,</p>" +
                            "                <div style=\"background-color: #f2f9ff; border-left: 4px solid #1DA1F2; padding: 15px; margin: 20px 0; border-radius: 4px;\">" +
                            "                    <p style=\"margin: 0; font-size: 16px;\">" +
                            "                        <span style=\"font-weight: bold; color: #1DA1F2;\">" + notification.getSenderName() + "</span> has just started following you on Blur!" +
                            "                    </p>" +
                            "                </div>" +
                            "                <p style=\"font-size: 16px;\">This could be the start of a great connection! Check out their profile and consider following them back.</p>" +
                            "                <div style=\"text-align: center; margin: 30px 0;\">" +
                            "                    <a href=\"https://blur.com/profile/" + notification.getSenderId() + "\" style=\"background-color: #1DA1F2; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 50px; font-weight: bold; display: inline-block; font-size: 16px;\">View Profile</a>" +
                            "                </div>" +
                            "                <p style=\"color: #777777; font-size: 14px; margin-top: 40px;\">Keep connecting and expanding your network!</p>" +
                            "            </div>" +

                            "    </div>" +
                            "</body>" +
                            "</html>";

            helper.setText(emailContent, true); // HTML enabled

            emailSender.send(message);
            log.info("Follow email notification sent to {}", notification.getReceiverEmail());
        } catch (Exception e) {
            log.error("Failed to send follow email notification to {}: {}", notification.getReceiverEmail(), e.getMessage(), e);
        }
    }

}
