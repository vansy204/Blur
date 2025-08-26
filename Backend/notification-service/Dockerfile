# Build stage
FROM maven:3.9.9-amazoncorretto-21 AS build

WORKDIR /app
COPY pom.xml .
COPY src ./src

# Clean và package trong cùng một câu lệnh để tránh lỗi cache
RUN mvn clean package -DskipTests

# Run stage
FROM amazoncorretto:21.0.4

WORKDIR /app
COPY --from=build /app/target/*.jar notification-service.jar

EXPOSE 8082

LABEL authors="vansy204"

ENTRYPOINT ["java", "-jar", "notification-service.jar"]
