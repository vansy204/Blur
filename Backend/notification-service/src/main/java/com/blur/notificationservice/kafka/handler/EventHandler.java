package com.blur.notificationservice.kafka.handler;

import com.fasterxml.jackson.core.JsonProcessingException;

public interface EventHandler<T> {
    boolean canHandle(String topic);
    void handleEvent(String jsonEvent) throws JsonProcessingException;
}
