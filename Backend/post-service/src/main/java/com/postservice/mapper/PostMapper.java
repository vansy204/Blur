package com.postservice.mapper;


import com.postservice.dto.response.PostResponse;
import com.postservice.entity.Post;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PostMapper {
    PostResponse toPostResponse(Post post);
}
