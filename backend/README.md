# Backend (Spring Boot)

## Overview
This is a Spring Boot backend using:
- Spring Web MVC
- Spring Security + JWT
- Spring Data JPA
- PostgreSQL (default runtime DB)
- H2 (test/in-memory support)

## Prerequisites
- Java 21+
- Maven 3.9+
- PostgreSQL (only for default runtime mode)

## Project Structure (Quick)
- src/main/java/com/pfa/backend: application code
- src/main/resources/application.properties: default runtime config (PostgreSQL)
- src/test/java: tests
- src/test/resources/application.properties: test config (H2)

## Setup
1. Clone and enter project:
```bash
git clone <your-repo-url>
cd backend
```

2. (Optional) Start PostgreSQL and create DB/user matching current config in src/main/resources/application.properties:
- DB: municipal_db
- User: municipal_user
- Password: municipal_pass

3. Build project:
```bash
mvn clean package
```

## Run the Application

### Option A: Default mode (PostgreSQL)
Uses src/main/resources/application.properties.
```bash
mvn spring-boot:run
```

### Option B: In-memory mode (H2, no PostgreSQL required)
```bash
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.datasource.url=jdbc:h2:mem:devdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL --spring.datasource.driver-class-name=org.h2.Driver --spring.datasource.username=sa --spring.datasource.password= --spring.jpa.hibernate.ddl-auto=create-drop --spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
```

## Execute Tests
```bash
mvn test
```

Tests use H2 via src/test/resources/application.properties.

## API Smoke Test (Auth)

### Register citizen
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Mohamed",
    "lastName": "Anis",
    "email": "anis@test.com",
    "password": "secret123",
    "phoneNumber": "21234567",
    "identifiantUnique": "12345678901",
    "role": "CITIZEN"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "anis@test.com", "password": "secret123"}'
```

Expected result for both calls: JSON response containing token, email, and role.

## Notes
- On Linux, Java file names are case-sensitive. Keep `AuthService.java` with lowercase `.java` extension.
- The `target/` folder is generated build output and should not be manually edited.
