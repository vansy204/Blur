package com.blur.chatservice.repository;

import com.blur.chatservice.entity.Message;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface MessageRepository extends MongoRepository<Message, String> {
}
