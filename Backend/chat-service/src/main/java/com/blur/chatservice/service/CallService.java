package com.blur.chatservice.service;

import com.blur.chatservice.entity.CallSession;
import com.blur.chatservice.enums.CallStatus;
import com.blur.chatservice.enums.CallType;
import com.blur.chatservice.repository.CallSessionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class CallService {
    CallSessionRepository callSessionRepository;
    RedisCacheService redisCacheService;
    NotificationService notificationService;

    private static final int RING_TIMEOUT = 60;
    private static final int ACTIVATE_CALL_TIMEOUT = 3600;
    private final CacheManager cacheManager;


    // tao 1 cuoc goi moi
    public CallSession initiateCall(
            String callerId,
            String callerName,
            String callerAvatar,
            String receiverId,
            String receiverName,
            String receiverAvatar,
            CallType callType,
            String callerSocketId,
            String conversationId
    ) {
        log.info("Initiating call: {} -> {}", callerId, receiverId);

        // 1. Check cache trước để tránh DB query
        if (redisCacheService.isUserInCall(receiverId)) {
            throw new IllegalStateException("User is currently in another call");
        }

        if (redisCacheService.isUserInCall(callerId)) {
            throw new IllegalStateException("You are currently in another call");
        }

        // 2. Tạo call session
        CallSession session = CallSession.builder()
                .id(UUID.randomUUID().toString())
                .callerId(callerId)
                .callerName(callerName)
                .callerAvatar(callerAvatar)
                .receiverId(receiverId)
                .receiverName(receiverName)
                .receiverAvatar(receiverAvatar)
                .callType(callType)
                .callStatus(CallStatus.INITIATING)
                .createdAt(LocalDateTime.now())
                .callerSockerId(callerSocketId)
                .conversationId(conversationId)
                .build();

        // 3. Lưu vào MongoDB
        CallSession saved = callSessionRepository.save(session);

        // 4. Cache vào Redis
        redisCacheService.cacheCallSession(saved.getId(), saved, RING_TIMEOUT);
        redisCacheService.markUserInCall(callerId, saved.getId(), RING_TIMEOUT);
        redisCacheService.markUserInCall(receiverId, saved.getId(), RING_TIMEOUT);

        return saved;
    }

    // cap nhat trang thai cuoc goi
    @CacheEvict(value = "callSessions", key = "#callId")
    public CallSession updateCallStatus(
            String callId,
            CallStatus newStatus,
            String receiverSocketId
    ){
        // lay tu cache truoc
        CallSession session = redisCacheService.getCallSession(callId,CallSession.class);

        // neu khong co trong cache lay tu db
        if(session == null){
            session = callSessionRepository.findById(callId)
                    .orElseThrow(()-> new IllegalStateException("CallSession not found"));
        }
        CallStatus oldStatus = session.getCallStatus();
        session.setCallStatus(newStatus);

        if(receiverSocketId != null){
            session.setReceiverSockerId(receiverSocketId);
        }

        // xu ly theo tranh thai
        switch (newStatus){
            case RINGING:
                redisCacheService.cacheCallSession(session.getId(), session, RING_TIMEOUT);
                notificationService.sendIncomingCallNotification(
                        session.getReceiverId(),
                        session.getCallerName(),
                        session.getCallType()
                        );
                break;
            case ANSWERED:
                session.setStartTime(LocalDateTime.now());

                redisCacheService.cacheCallSession(session.getId(), session, ACTIVATE_CALL_TIMEOUT);
                redisCacheService.markUserInCall(session.getCallerId(), session.getId(), ACTIVATE_CALL_TIMEOUT);
                redisCacheService.markUserInCall(session.getReceiverId(), session.getCallerName(), ACTIVATE_CALL_TIMEOUT);
                break;
            case ENDED:
            case REJECTED:
            case MISSED:
            case FAILED:
            case BUSY:
                session.setEndTime(LocalDateTime.now());
                session.setEndReason(newStatus.name());

                if(session.getStartTime() != null){
                    Duration duration = Duration.between(session.getStartTime(), LocalDateTime.now());
                    session.setDuration(duration.toSeconds());
                }

                //clean redis
                redisCacheService.cleanupCallCaches(callId, session.getCallerId(), session.getReceiverId());

                // tang so cuoc goi bi nho
                if(newStatus == CallStatus.MISSED) {
                    redisCacheService.incrementMissedCalls(session.getReceiverId());
                    notificationService.sendMissedCallNotification(
                            session.getReceiverId(),
                            session.getCallerName(),
                            session.getCallType()
                    );
                }
                break;
        }
        // save to db
        return callSessionRepository.save(session);
    }

    public CallSession endCall(String callerId,String userId){
        return updateCallStatus(callerId, CallStatus.ENDED, null);
    }
    public CallSession rejectCall(String callerId,String userId){
        return updateCallStatus(callerId, CallStatus.REJECTED, null);
    }
    public boolean isUserInCall(String userId){
        return redisCacheService.isUserInCall(userId);
    }

    // lay current call cua user
    public Optional<CallSession> getUserCurrentCall(String userId){
        String callId = redisCacheService.getUserCurrentCallId(userId);
        if(callId == null){
            return Optional.empty();
        }
        return getCallSessionById(callId);
    }

    // lay call Id hien tai cua user
    public String getUserCurrentCallId(String userId){
        return redisCacheService.getUserCurrentCallId(userId);
    }

    // lay call session hien tai
    @Cacheable(value = "callSessions", key = "#callId", unless = "#result == null ")
    public Optional<CallSession> getCallSessionById(String callId){
        // lay trong cache truoc
        CallSession cached = redisCacheService.getCallSession(callId, CallSession.class);
        if(cached != null){
            return Optional.of(cached);
        }
        return callSessionRepository.findById(callId);
    }

    // lay call history
    @Cacheable(value = "callHistory", key = "#userId +'_'+ #page + '_'+#size")
    public Page<CallSession> getCallHistory(String userId, int page, int size){
        PageRequest pageRequest = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );
        return callSessionRepository.findByCallerIdOrReceiverId(userId,pageRequest);
    }

    // lay missed call
    public List<CallSession> getMissedCalls(String userId){
        return callSessionRepository.findMissedCallsByReceiverId(userId);
    }

    // dem miss call
    public long countMissedCalls(String userId){
        // lay trong cache trc
        long cachedCount = redisCacheService.getMissedCallCount(userId);
        if(cachedCount > 0){
            return cachedCount;
        }
        long dbCount = callSessionRepository.countMissedCallsByReceiverId(userId);
        if(dbCount > 0){
            for(int i = 0; i < dbCount; i++){
                redisCacheService.incrementMissedCalls(userId);
            }
        }
        return dbCount;
    }

    // danh dau miss call da doc
    @CacheEvict(value = "callHistory", key = "#userId +'_*'", allEntries = true)
    public void markMissedCallsAsRead(String userId){
        redisCacheService.resetMissedCalls(userId);
    }



}
