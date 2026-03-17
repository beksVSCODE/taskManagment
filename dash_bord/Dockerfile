# Multi-stage build
# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build application
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy JAR from build stage
COPY --from=build /app/target/demo-0.0.1-SNAPSHOT.jar app.jar

# Expose port (Render will dynamically assign PORT env var)
EXPOSE 8080

# Run the application
CMD ["sh", "-c", "if [ -n \"$DATABASE_URL\" ] && [ -z \"$SPRING_DATASOURCE_URL\" ] && [ -z \"$JDBC_DATABASE_URL\" ]; then export SPRING_DATASOURCE_URL=$(echo \"$DATABASE_URL\" | sed 's#^postgres://#jdbc:postgresql://#'); fi; java -jar app.jar --server.port=${PORT:-8080}"]
