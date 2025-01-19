package com.blur.notificationservice.dto.response;

import com.blur.notificationservice.dto.request.Recipient;
import com.blur.notificationservice.dto.request.Sender;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EmailResponse {
    String messageId;
}
