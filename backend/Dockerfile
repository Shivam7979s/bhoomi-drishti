# ── Stage 1: Build ────────────────────────────────────────────────────────────
# Use the official Maven + JDK 21 image so we never need the mvnw wrapper.
FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /app

# Copy pom first so dependency layer is cached separately from source code.
COPY pom.xml ./
RUN mvn dependency:go-offline -q

# Copy source and build the fat JAR.
COPY src/ src/
RUN mvn clean package -DskipTests -q

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
