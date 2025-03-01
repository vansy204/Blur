package com.blur.profileservice.repository;

import com.blur.profileservice.entity.UserProfile;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserProfileRepository extends Neo4jRepository<UserProfile, String> {
    public Optional<UserProfile> findUserProfileByUserId(String userId);
}
