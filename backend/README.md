# Municipal Complaint Platform Backend

## Overview
This backend is a Spring Boot REST API for the municipal complaint platform. It handles authentication, role-based workflows, complaint creation and tracking, SLA calculation, attachment uploads, and the public summary data shown on the frontend home page.

## Stack
- Spring Boot 4
- Spring Web MVC
- Spring Security + JWT
- Spring Data JPA / Hibernate
- PostgreSQL / PostGIS for runtime
- H2 for tests

## Main Features
- Register and login endpoints for citizens, agents, and administrators
- Role-aware registration using `ROLE_CITIZEN`, `ROLE_AGENT`, and `ROLE_ADMIN`
- Compatibility for short role values such as `CITIZEN`, `AGENT`, and `ADMIN`
- Complaint creation with category-based SLA calculation
- Complaint location support through GPS coordinates or `streetName`
- Attachment upload endpoint restricted to image files
- Public summary endpoint at `GET /api/complaints/public/home`
- Admin and agent workflow endpoints for assignment and status changes

## Prerequisites
- Java 21+
- Maven 3.9+ or the included Maven wrapper `./mvnw`
- PostgreSQL 16+ for default runtime mode
- Docker optional

## Project Structure
- `src/main/java/com/pfa/backend`: application source
- `src/main/resources/application.properties`: default runtime configuration
- `src/test/java`: tests
- `src/test/resources/application.properties`: H2 test configuration

## Local Development
1. Enter the backend directory:

```bash
cd backend
```

2. Build the project:

```bash
./mvnw clean package
```

3. Run with PostgreSQL using the default configuration:

```bash
./mvnw spring-boot:run
```

### H2 In-Memory Mode
If you want to run the backend without PostgreSQL:

```bash
./mvnw spring-boot:run -Dspring-boot.run.arguments="--spring.datasource.url=jdbc:h2:mem:devdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL --spring.datasource.driver-class-name=org.h2.Driver --spring.datasource.username=sa --spring.datasource.password= --spring.jpa.hibernate.ddl-auto=create-drop --spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
```

## Docker Compose
From the repository root:

```bash
docker compose up -d --build db backend
```

To run the full stack:

```bash
docker compose up -d --build backend frontend
```

With the repository Docker setup:
- Database: `localhost:5432`
- Backend API: `localhost:8080`
- Frontend: `localhost:5173`

## Execute Tests
Run the full test suite:

```bash
./mvnw test
```

Run a focused complaint-service test:

```bash
./mvnw -q -Dtest=ComplaintServiceSlaTest test
```

Tests use H2 via `src/test/resources/application.properties`.

## Seed Data
The project includes an optional startup seeder in:

- `src/main/java/com/pfa/backend/config/DataSeeder.java`

Important:
- The repository root `docker-compose.yml` currently sets `APP_SEED_ENABLED=false`
- That means the default Docker startup does not create demo accounts automatically

Enable seeding in local runs with:

```bash
./mvnw spring-boot:run -Dspring-boot.run.arguments="--app.seed.enabled=true"
```

Or in Docker Compose by starting the backend with `APP_SEED_ENABLED=true`.

When seeding is enabled, these demo accounts are created:
- Admin: `admin.demo@municipalite.tn` / `Admin@123`
- Agent: `agent.demo@municipalite.tn` / `Agent@123`
- Citizen: `citizen.demo@municipalite.tn` / `Citizen@123`

The seeder also creates the default complaint categories and one starter complaint.

## Demo Rehearsal Script
Use the script below to rehearse the full workflow repeatedly:

```bash
chmod +x scripts/rehearse_demo.sh
REHEARSALS=3 ./scripts/rehearse_demo.sh
```

Each run validates:
- login for citizen, admin, and agent
- complaint creation by citizen
- assignment by admin
- status transitions by agent (`IN_PROGRESS -> RESOLVED`)
- feedback submission by citizen (`RESOLVED -> CLOSED`)

## API Smoke Tests

### Register a citizen
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Mohamed",
    "lastName": "Anis",
    "email": "anis@test.com",
    "password": "secret123",
    "phoneNumber": "21234567",
    "numCin": "12345678",
    "identifiantUnique": "12345678901",
    "role": "ROLE_CITIZEN"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "anis@test.com", "password": "secret123"}'
```

### Create a complaint with street-name fallback
```bash
curl -X POST http://localhost:8080/api/complaints \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Streetlight issue",
    "description": "Streetlight has been broken for several nights.",
    "priority": "Medium",
    "categoryId": 2,
    "streetName": "Habib Bourguiba Avenue"
  }'
```

### Read public home summary data
```bash
curl http://localhost:8080/api/complaints/public/home
```

## Notes
- The frontend defaults to `http://localhost:8080/api` as its API base URL.
- The `target/` directory is generated build output and should not be edited manually.
- On Linux, Java file names are case-sensitive.
