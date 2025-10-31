// common-library/src/main/java/com/company/common/service/RedisService.java
package com.blur.commonlibrary.service;

import java.time.Duration;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisService {

    private final RedisTemplate<String, Object> redisTemplate;

    public void set(String key, Object value, long timeout, TimeUnit unit) {
        try {
            redisTemplate.opsForValue().set(key, value, timeout, unit);
            log.debug("Set key: {} with TTL: {} {}", key, timeout, unit);
        } catch (Exception e) {
            log.error("Error setting key: {}", key, e);
        }
    }

    public void set(String key, Object value) {
        try {
            redisTemplate.opsForValue().set(key, value);
            log.debug("Set key: {}", key);
        } catch (Exception e) {
            log.error("Error setting key: {}", key, e);
        }
    }


    public Object get(String key) {
        try {
            return redisTemplate.opsForValue().get(key);
        } catch (Exception e) {
            log.error("Error getting key: {}", key, e);
            return null;
        }
    }

    /**
     * Set if absent (setnx)
     * Use case: Distributed lock
     */
    public Boolean setIfAbsent(String key, Object value, Duration timeout) {
        try {
            return redisTemplate.opsForValue().setIfAbsent(key, value, timeout);
        } catch (Exception e) {
            log.error("Error setting if absent key: {}", key, e);
            return false;
        }
    }

    /**
     * Increment counter
     * Use case: View count, like count
     */
    public Long increment(String key) {
        try {
            return redisTemplate.opsForValue().increment(key);
        } catch (Exception e) {
            log.error("Error incrementing key: {}", key, e);
            return null;
        }
    }

    /**
     * Increment by delta
     */
    public Long incrementBy(String key, long delta) {
        try {
            return redisTemplate.opsForValue().increment(key, delta);
        } catch (Exception e) {
            log.error("Error incrementing key: {} by {}", key, delta, e);
            return null;
        }
    }

    /**
     * Decrement counter
     */
    public Long decrement(String key) {
        try {
            return redisTemplate.opsForValue().decrement(key);
        } catch (Exception e) {
            log.error("Error decrementing key: {}", key, e);
            return null;
        }
    }

    // ==================== HASH OPERATIONS ====================

    /**
     * Put value vào hash
     * Use case: User session data, cart items
     */
    public void hPut(String key, String hashKey, Object value) {
        try {
            redisTemplate.opsForHash().put(key, hashKey, value);
            log.debug("Hash put - key: {}, hashKey: {}", key, hashKey);
        } catch (Exception e) {
            log.error("Error hash putting key: {}, hashKey: {}", key, hashKey, e);
        }
    }

    /**
     * Get value từ hash
     */
    public Object hGet(String key, String hashKey) {
        try {
            return redisTemplate.opsForHash().get(key, hashKey);
        } catch (Exception e) {
            log.error("Error hash getting key: {}, hashKey: {}", key, hashKey, e);
            return null;
        }
    }

    /**
     * Get all entries trong hash
     */
    public Map<Object, Object> hGetAll(String key) {
        try {
            return redisTemplate.opsForHash().entries(key);
        } catch (Exception e) {
            log.error("Error hash getting all key: {}", key, e);
            return null;
        }
    }

    /**
     * Delete hash field
     */
    public Long hDelete(String key, Object... hashKeys) {
        try {
            return redisTemplate.opsForHash().delete(key, hashKeys);
        } catch (Exception e) {
            log.error("Error hash deleting key: {}", key, e);
            return null;
        }
    }

    // ==================== SET OPERATIONS ====================

    /**
     * Add members to set
     * Use case: Tags, user followers
     */
    public Long sAdd(String key, Object... values) {
        try {
            return redisTemplate.opsForSet().add(key, values);
        } catch (Exception e) {
            log.error("Error set adding key: {}", key, e);
            return null;
        }
    }

    /**
     * Get all members
     */
    public Set<Object> sMembers(String key) {
        try {
            return redisTemplate.opsForSet().members(key);
        } catch (Exception e) {
            log.error("Error set getting members key: {}", key, e);
            return null;
        }
    }

    /**
     * Check if member exists
     */
    public Boolean sIsMember(String key, Object value) {
        try {
            return redisTemplate.opsForSet().isMember(key, value);
        } catch (Exception e) {
            log.error("Error checking set member key: {}, value: {}", key, value, e);
            return false;
        }
    }

    // ==================== SORTED SET OPERATIONS ====================

    /**
     * Add to sorted set với score
     * Use case: Leaderboard, ranking
     */
    public Boolean zAdd(String key, Object value, double score) {
        try {
            return redisTemplate.opsForZSet().add(key, value, score);
        } catch (Exception e) {
            log.error("Error sorted set adding key: {}", key, e);
            return false;
        }
    }

    /**
     * Get range by score (ascending)
     */
    public Set<Object> zRangeByScore(String key, double min, double max) {
        try {
            return redisTemplate.opsForZSet().rangeByScore(key, min, max);
        } catch (Exception e) {
            log.error("Error sorted set range by score key: {}", key, e);
            return null;
        }
    }

    /**
     * Get top N members (highest scores)
     * Use case: Top users, best products
     */
    public Set<Object> zRevRange(String key, long start, long end) {
        try {
            return redisTemplate.opsForZSet().reverseRange(key, start, end);
        } catch (Exception e) {
            log.error("Error sorted set reverse range key: {}", key, e);
            return null;
        }
    }

    /**
     * Get rank of member (0-based)
     */
    public Long zRank(String key, Object value) {
        try {
            return redisTemplate.opsForZSet().rank(key, value);
        } catch (Exception e) {
            log.error("Error getting sorted set rank key: {}, value: {}", key, value, e);
            return null;
        }
    }

    // ==================== LIST OPERATIONS ====================

    /**
     * Push to list (left)
     */
    public Long lPush(String key, Object... values) {
        try {
            return redisTemplate.opsForList().leftPushAll(key, values);
        } catch (Exception e) {
            log.error("Error list pushing key: {}", key, e);
            return null;
        }
    }

    /**
     * Get range from list
     */
    public List<Object> lRange(String key, long start, long end) {
        try {
            return redisTemplate.opsForList().range(key, start, end);
        } catch (Exception e) {
            log.error("Error list range key: {}", key, e);
            return null;
        }
    }

    // ==================== KEY OPERATIONS ====================

    /**
     * Delete key(s)
     */
    public Boolean delete(String key) {
        try {
            return redisTemplate.delete(key);
        } catch (Exception e) {
            log.error("Error deleting key: {}", key, e);
            return false;
        }
    }

    /**
     * Delete multiple keys
     */
    public Long delete(Collection<String> keys) {
        try {
            return redisTemplate.delete(keys);
        } catch (Exception e) {
            log.error("Error deleting keys: {}", keys, e);
            return null;
        }
    }

    /**
     * Check if key exists
     */
    public Boolean hasKey(String key) {
        try {
            return redisTemplate.hasKey(key);
        } catch (Exception e) {
            log.error("Error checking key exists: {}", key, e);
            return false;
        }
    }

    /**
     * Set expiration time
     */
    public Boolean expire(String key, long timeout, TimeUnit unit) {
        try {
            return redisTemplate.expire(key, timeout, unit);
        } catch (Exception e) {
            log.error("Error setting expiration for key: {}", key, e);
            return false;
        }
    }

    /**
     * Get TTL
     */
    public Long getExpire(String key, TimeUnit unit) {
        try {
            return redisTemplate.getExpire(key, unit);
        } catch (Exception e) {
            log.error("Error getting expiration for key: {}", key, e);
            return null;
        }
    }

    /**
     * Get keys by pattern
     * WARNING: Expensive operation, use with caution in production
     */
    public Set<String> keys(String pattern) {
        try {
            return redisTemplate.keys(pattern);
        } catch (Exception e) {
            log.error("Error getting keys by pattern: {}", pattern, e);
            return null;
        }
    }
}