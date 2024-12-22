#state 1: build
#start with a maven image that includes jdk 21
FROM maven:3.9.9-amazoncorretto-21 AS build

#copy source code and pom.xml file to /app folder
WORKDIR /app
COPY pom.xml .
COPY src ./src

#Build ssource code with maven

RUN mvn package -DskipTests

#state 2: create image
#start with amazom correto jdk 21

FROM amazoncorretto:21.0.4

#set working folder to App and copy compiled file from above step
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

LABEL authors="vansy204"

#command to run the application
ENTRYPOINT ["java", "-jar" ,"app.jar"]