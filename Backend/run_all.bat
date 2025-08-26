@echo off
echo ==== STARTING ALL SPRING BOOT SERVICES ====

start cmd /k "cd IdentityService && mvn spring-boot:run"
start cmd /k "cd profile-service && mvn spring-boot:run"
start cmd /k "cd notification-service && mvn spring-boot:run"
start cmd /k "cd chat-service && mvn spring-boot:run"
start cmd /k "cd post-service && mvn spring-boot:run"
start cmd /k "cd story-service && mvn spring-boot:run"
start cmd /k "cd api-gateway && mvn spring-boot:run"

echo ==== ALL SERVICES STARTED ====
