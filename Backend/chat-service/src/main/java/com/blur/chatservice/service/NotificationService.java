package com.blur.chatservice.service;

import org.springframework.stereotype.Service;

import com.blur.chatservice.enums.CallType;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    /**
     * Gửi notification khi có cuộc gọi đến
     * (Tạm thời chỉ log, có thể tích hợp Firebase FCM sau)
     */
    public void sendIncomingCallNotification(String userId, String callerName, CallType callType) {
        log.info("📞 Sending incoming call notification to user: {}", userId);
        log.info("   Caller: {}, Type: {}", callerName, callType);

        // TODO: Tích hợp Firebase Cloud Messaging
        // FirebaseMessaging.getInstance().send(message);

        // TODO: Hoặc lưu vào notification table trong DB
        // notificationRepository.save(notification);
    }

    /**
     * Gửi notification khi nhỡ cuộc gọi
     */
    public void sendMissedCallNotification(String userId, String callerName, CallType callType) {
        log.info("📵 Sending missed call notification to user: {}", userId);
        log.info("   Caller: {}, Type: {}", callerName, callType);

        // TODO: Same as above
    }
}
