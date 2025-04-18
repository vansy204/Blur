package com.fileservice.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Collections;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PageResponse <T>{
    int currentPage;
    int pageSize;
    int totalElements;
    @Builder.Default
    private List<T> data = Collections.emptyList();
}
