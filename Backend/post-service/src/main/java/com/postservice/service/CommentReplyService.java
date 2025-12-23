package com.postservice.service;

import com.postservice.dto.event.Event;
import com.postservice.dto.request.CreateCommentRequest;
import com.postservice.dto.response.CommentResponse;
import com.postservice.entity.CommentReply;
import com.postservice.exception.AppException;
import com.postservice.exception.ErrorCode;
import com.postservice.mapper.CommentMapper;
import com.postservice.repository.CommentReplyRepository;
import com.postservice.repository.CommentRepository;
import com.postservice.repository.PostRepository;
import com.postservice.repository.httpclient.IdentityClient;
import com.postservice.repository.httpclient.NotificationClient;
import com.postservice.repository.httpclient.ProfileClient;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Builder
@RequiredArgsConstructor
@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CommentReplyService {
    CommentReplyRepository commentReplyRepository;
    CommentRepository commentRepository;
    CommentMapper commentMapper;
    ProfileClient profileClient;
    IdentityClient identityClient;
    NotificationClient notificationClient;
    PostRepository postRepository;

    @Caching(evict = {
            @CacheEvict(value = "commentReplies", key = "#commentId"),
            @CacheEvict(value = "nestedReplies", key = "#parentReplyId", condition = "#parentReplyId != null")
    })
    public CommentResponse createCommentReply(
            String commentId,
            String parentReplyId,
            CreateCommentRequest commentRequest
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUserId = auth.getName();

        log.info("🔵 [STEP 1] Creating reply - Current User ID: {}", currentUserId);

        // 1. Tìm comment gốc
        var comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));

        log.info("🔵 [STEP 2] Found comment ID: {} created by user: {}", comment.getId(), comment.getUserId());

        // 2. Nếu reply vào 1 reply khác
        CommentReply parentReply = null;
        if (parentReplyId != null) {
            parentReply = commentReplyRepository.findById(parentReplyId)
                    .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));
            log.info("🔵 [STEP 3] Found parent reply ID: {} created by user: {}",
                    parentReply.getId(), parentReply.getUserId());
        } else {
            log.info("🔵 [STEP 3] No parent reply - replying directly to comment");
        }

        // 3. Lấy profile người đang reply (sender)
        log.info("🔵 [STEP 4] Fetching sender profile...");
        var senderProfileRes = profileClient.getProfile(currentUserId);
        var senderProfile = senderProfileRes.getResult();

        String senderFirstName = senderProfile.getFirstName() != null ? senderProfile.getFirstName() : "";
        String senderLastName = senderProfile.getLastName() != null ? senderProfile.getLastName() : "";
        String senderFullName = (senderFirstName + " " + senderLastName).trim();
        String senderImageUrl = senderProfile.getImageUrl();

        if (senderFullName.isEmpty()) {
            log.warn("⚠️ [STEP 4] Sender has no first/last name, fetching username from Identity...");
            var senderIdentity = identityClient.getUser(currentUserId);
            senderFullName = senderIdentity.getResult().getUsername();
        }

        log.info("🔵 [STEP 4] Sender info - Full Name: '{}', Image URL: '{}'",
                senderFullName, senderImageUrl);

        // 4. Tạo CommentReply
        CommentReply commentReply = CommentReply.builder()
                .userId(currentUserId)
                .userName(senderFullName)
                .content(commentRequest.getContent())
                .commentId(comment.getId())
                .parentReplyId(parentReplyId)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        commentReply = commentReplyRepository.save(commentReply);
        log.info("✅ [STEP 5] CommentReply saved with ID: {}", commentReply.getId());

        // 5. Xác định người nhận thông báo
        String receiverUserId;
        String senderUserId = currentUserId;
        if (parentReply != null) {
            receiverUserId = parentReply.getUserId();
            log.info("🔵 [STEP 6] Receiver is PARENT REPLY owner: {}", receiverUserId);
        } else {
            receiverUserId = comment.getUserId();
            log.info("🔵 [STEP 6] Receiver is COMMENT owner: {}", receiverUserId);
        }

        // 6. Kiểm tra xem có phải tự reply không
        if (receiverUserId.equals(currentUserId)) {
            log.warn("⚠️ [STEP 7] SKIP notification - User is replying to their own comment/reply");
            return commentMapper.toCommentResponse(commentReply);
        }

        log.info("✅ [STEP 7] Different users detected - Preparing notification...");
        log.info("   → Sender ID: {}", currentUserId);
        log.info("   → Receiver ID: {}", receiverUserId);

        try {
            // Lấy thông tin sender từ Identity
            log.info("🔵 [STEP 8] Fetching sender identity info...");
            var senderIdentity = identityClient.getUser(currentUserId);

            // Lấy thông tin receiver
            log.info("🔵 [STEP 9] Fetching receiver info...");
            var receiverIdentity = identityClient.getUser(receiverUserId);
            var receiverProfileRes = profileClient.getProfile(receiverUserId);
            var receiverProfile = receiverProfileRes.getResult();

            String receiverFirstName = receiverProfile.getFirstName() != null ? receiverProfile.getFirstName() : "";
            String receiverLastName = receiverProfile.getLastName() != null ? receiverProfile.getLastName() : "";
            String receiverFullName = (receiverFirstName + " " + receiverLastName).trim();

            if (receiverFullName.isEmpty()) {
                receiverFullName = receiverIdentity.getResult().getUsername();
            }

            log.info("🔵 [STEP 9] Receiver info - Full Name: '{}', Email: '{}'",
                    receiverFullName, receiverIdentity.getResult().getEmail());

            // Tạo Event
            Event event = Event.builder()
                    .postId(comment.getPostId())

                    .senderId(senderIdentity.getResult().getId())
                    .senderUserId(senderUserId)
                    .senderName(senderFullName)
                    .senderFirstName(senderFirstName)
                    .senderLastName(senderLastName)
                    .senderImageUrl(senderImageUrl)

                    .receiverId(receiverIdentity.getResult().getId())
                    .receiverUserId(receiverUserId)
                    .receiverName(receiverFullName)
                    .receiverEmail(receiverIdentity.getResult().getEmail())

                    .timestamp(LocalDateTime.now())
                    .build();

            log.info("🔵 [STEP 10] Event created:");
            log.info("   → Post ID: {}", event.getPostId());
            log.info("   → Sender: {} ({})", event.getSenderName(), event.getSenderId());
            log.info("   → Receiver: {} ({})", event.getReceiverName(), event.getReceiverId());
            log.info("   → Image URL: {}", event.getSenderImageUrl());

            // GỬI NOTIFICATION QUA FEIGN CLIENT
            log.info("🔵 [STEP 11] Calling NotificationClient.sendReplyCommentNotification()...");
            notificationClient.sendReplyCommentNotification(event);

            log.info("✅✅✅ [STEP 12] NOTIFICATION SENT SUCCESSFULLY! ✅✅✅");

        } catch (Exception e) {
            log.error("❌❌❌ [ERROR] Failed to send notification: {}", e.getMessage());
            log.error("Stack trace:", e);
            // Không throw exception để không làm fail toàn bộ reply action
        }

        return commentMapper.toCommentResponse(commentReply);
    }

    @Caching(evict = {
            @CacheEvict(value = "commentReplies", key = "#root.target.getCommentIdByReplyId(#commentReplyId)"),
            @CacheEvict(value = "nestedReplies", key = "#root.target.getParentReplyId(#commentReplyId)"),
            @CacheEvict(value = "commentReplyById", key = "#commentReplyId")
    })
    public CommentResponse updateCommentReply(String commentReplyId, CreateCommentRequest commentReply) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        var userId = auth.getName();
        var comment = commentReplyRepository.findById(commentReplyId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));
        if (!comment.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        comment.setUpdatedAt(Instant.now());
        comment.setContent(commentReply.getContent());
        return commentMapper.toCommentResponse(commentReplyRepository.save(comment));
    }

    @Caching(evict = {
            @CacheEvict(value = "commentReplies", key = "#root.target.getCommentIdByReplyId(#commentId)"),
            @CacheEvict(value = "nestedReplies", key = "#root.target.getParentReplyId(#commentId)"),
            @CacheEvict(value = "commentReplyById", key = "#commentId")
    })
    public String deleteCommentReply(String commentId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        var userId = auth.getName();
        var comment = commentReplyRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));
        if (!comment.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        commentReplyRepository.deleteById(comment.getId());
        return "Comment deleted";
    }

    @Cacheable(
            value = "commentReplies",
            key = "#commentId",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<CommentResponse> getAllCommentReplyByCommentId(String commentId) {
        var commentResponses = commentReplyRepository.findAllByCommentId(commentId);
        return commentResponses.stream().map(commentMapper::toCommentResponse)
                .collect(Collectors.toList());
    }

    @Cacheable(
            value = "commentReplyById",
            key = "#commentReplyId",
            unless = "#result == null"
    )
    public CommentResponse getCommentReplyByCommentReplyId(String commentReplyId) {
        var commentReply = commentReplyRepository.findById(commentReplyId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));
        return commentMapper.toCommentResponse(commentReply);
    }

    @Cacheable(
            value = "nestedReplies",
            key = "#parentReplyId",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<CommentResponse> getRepliesByParentReplyId(String parentReplyId) {
        return commentReplyRepository.findAllByParentReplyId(parentReplyId)
                .stream()
                .map(commentMapper::toCommentResponse)
                .collect(Collectors.toList());
    }

    public String getCommentIdByReplyId(String replyId) {
        return commentReplyRepository.findById(replyId)
                .map(CommentReply::getCommentId)
                .orElse(null);
    }

    public String getParentReplyId(String replyId) {
        return commentReplyRepository.findById(replyId)
                .map(CommentReply::getParentReplyId)
                .orElse(null);
    }
}