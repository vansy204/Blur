package com.postservice.repository;

import com.postservice.entity.PostLike;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostLikeRepository extends MongoRepository<PostLike, String> {
    // ✅ Kiểm tra người dùng đã like bài viết chưa
    boolean existsByUserIdAndPostId(String userId, String postId);

    // ✅ Tìm bản ghi like của người dùng cho bài viết
    Optional<PostLike> findByUserIdAndPostId(String userId, String postId);
    List<PostLike> findAllByPostId(String postId);
}
