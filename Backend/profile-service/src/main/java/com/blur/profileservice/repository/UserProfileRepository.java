package com.blur.profileservice.repository;

import com.blur.profileservice.entity.UserProfile;
import feign.Param;
import org.apache.catalina.User;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserProfileRepository extends Neo4jRepository<UserProfile, String> {
    Optional<UserProfile> findUserProfileByUserId(String userId);

    Optional<UserProfile> findByUserId(String userId);
    List<UserProfile> findAllByFirstNameContainingIgnoreCase(String firstName);
    @Query("""
            MATCH (a:user_profile {user_id: $fromId})
            MATCH (b:user_profile {user_id: $toId})
            MERGE (a)-[:follows]->(b)
           """)
    void follow(@Param("fromId") String fromId, @Param("toId") String toId);


    @Query("MATCH (a:user_profile {user_id: $fromId})-[r:follows]->(b:user_profile {user_id: $toId}) DELETE r")
    void unfollow(@Param("fromId") String fromId, @Param("toId") String toId);

}
