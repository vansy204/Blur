FROM maven:3.9.9-amazoncorretto-21 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn clean package -DskipTests

FROM amazoncorretto:21.0.4
WORKDIR /app

COPY --from=build /app/target/*.jar notification-service.jar

EXPOSE 8085
LABEL authors="vansy204"

ENTRYPOINT ["java", "-jar", "notification-service.jar"]
