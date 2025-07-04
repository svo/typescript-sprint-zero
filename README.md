# TypeScript Sprint Zero

[![Service](https://github.com/svo/typescript-sprint-zero/actions/workflows/service.yml/badge.svg)](https://github.com/svo/typescript-sprint-zero/actions/workflows/service.yml)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](https://github.com/svo/typescript-sprint-zero)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

> Minimal, opinionated scaffolding for TypeScript backend services following hexagonal architecture and domain-driven design principles with 100% test coverage and comprehensive CI/CD.

## Features

- **Hexagonal Architecture** with clear separation of concerns
- **Domain-Driven Design** principles and patterns
- **100% Test Coverage** with comprehensive test suite
- **OpenAPI Documentation** auto-generated from code
- **Security by Design** with authentication middleware
- **CI/CD Pipeline** with Docker builds and multi-platform support
- **Developer Experience** with hot reload, linting, and formatting
- **Framework Agnostic** HTTP abstraction layer
- **Architecture Validation** with dependency boundary enforcement

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Development](#development)
- [Architecture](#architecture)
- [Scripts and Commands](#scripts-and-commands)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/svo/typescript-sprint-zero.git
cd typescript-sprint-zero

# Install dependencies
npm install

# Run the complete test suite
npm run test:all

# Start development server
npm run dev
```

## Development

### Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Docker**: For containerized builds (optional)

### Getting Started

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Run tests with coverage
npm run test:coverage

# Start production server
npm start
```

## Architecture

The architectural structure and design rules for this project uses a combination of **Hexagonal Architecture** and **Domain-Driven Design (DDD)** principles. The architecture is organized into clearly separated domain, application, infrastructure, and interface layers, following clean architecture principles. The domain layer encapsulates entities and business rules, the application layer manages orchestration through use cases, infrastructure contains data persistence implementations with repositories, and the interface layer provides **RESTful** **API** routes. The structure emphasizes high test coverage, maintainability, and security by design.

---

### Project Structure Overview

```
project/
├── src/
│   ├── application/                    # Use cases
│   │   └── use-case/
│   │       ├── create-user.use-case.ts
│   │       ├── get-user.use-case.ts
│   │       └── health.use-case.ts
│   │
│   ├── domain/                         # Business logic
│   │   ├── health/
│   │   │   ├── health-checker.ts
│   │   │   └── health-status.ts
│   │   ├── model/
│   │   │   └── user.ts
│   │   └── repository/
│   │       └── user-repository.ts
│   │
│   ├── infrastructure/                 # Adapters, drivers
│   │   ├── persistence/
│   │   │   └── memory/
│   │   │       └── in-memory-user-repository.ts
│   │   ├── security/
│   │   │   └── basic-authenticator.ts
│   │   └── system/
│   │       └── system-health-checker.ts
│   │
│   ├── interfaces/                     # APIs and HTTP handlers
│   │   └── http/
│   │       ├── controllers/
│   │       │   ├── user.controller.ts
│   │       │   └── health.controller.ts
│   │       ├── dto/
│   │       │   ├── user.dto.ts
│   │       │   └── health.dto.ts
│   │       ├── middleware/
│   │       │   └── auth.middleware.ts
│   │       ├── routes/
│   │       │   ├── user.routes.ts
│   │       │   └── health.routes.ts
│   │       └── server.ts
│   │
│   ├── config/                         # DI and configuration
│   │   ├── container.ts
│   │   └── environment.ts
│   │
│   └── main.ts                         # Application entry point
│
├── test/                               # Tests matching src structure
│   ├── application/
│   ├── domain/
│   ├── infrastructure/
│   └── interfaces/
│
├── .github/workflows/                  # CI/CD workflows
└── infrastructure/                     # Deployment and provisioning
```

---

### Design Principles

#### Domain

- `model/` contain pure domain entities (e.g., `User`)
- `repository/` define interfaces for persistence (abstract base classes)
- `health/` contain health check logic and status definitions

#### Application

- Use cases (`*.use-case.ts`) orchestrate logic/delegate to domain and infrastructure
- Should not directly depend on Express, database, or file system
- Handle request/response transformation and validation

#### Infrastructure

- Implements interfaces from `domain/repository`
- `persistence/` handles data storage implementations
- `security/` provides authentication and authorization
- `system/` contains diagnostics (e.g., health checks)

#### Interfaces

- `http/controllers/` expose Express routes and depend on use cases
- `http/dto/` define request/response data transfer objects
- `http/middleware/` contains cross-cutting concerns like authentication
- `http/routes/` define API route configurations

#### Config

- `container.ts` manages dependency injection setup
- `environment.ts` loads and validates configuration

---

### Dependency Injection

This project uses **tsyringe** as the dependency injection framework to enhance modularity, testability, and maintainability.

#### Key Principles

- **Inversion of Control**: Dependencies are provided to components rather than created internally
- **Interface-based Programming**: Components depend on abstractions (interfaces) rather than concrete implementations
- **Single Responsibility**: Each component focuses on its core functionality, with dependencies injected as needed
- **Testability**: Allows easy replacement of dependencies with test doubles (mocks, stubs) in unit tests

#### Using `tsyringe` for Dependency Injection

`tsyringe` provides a lightweight, TypeScript-native approach to dependency injection with features that align well with our architecture:

- **Type-based Resolution**: Dependencies are resolved based on type annotations and tokens
- **Decorator Support**: Use `@injectable()` and `@inject()` decorators for clean dependency declaration
- **Singleton and Transient Support**: Configure lifecycle management for different dependency types
- **Container Hierarchies**: Create specialized containers for different application contexts

---

### Enhancing System Quality

#### Performance and Scalability

- Implement caching strategies for frequently accessed data
- Use async/await patterns for non-blocking operations
- Consider connection pooling for database operations

#### Reliability and Fault Tolerance

- Implement retry mechanisms for external service calls
- Use circuit breaker patterns for service resilience
- Clearly document error handling and recovery procedures

#### Maintainability and Modularity

- Clearly define module boundaries using TypeScript interfaces
- Follow consistent naming conventions and code organization
- Use strict TypeScript configuration to catch errors early

#### Observability and Monitoring

- Structured logging with correlation IDs
- Health check endpoints for monitoring
- Performance metrics collection

#### Security

- Input validation at interface boundaries
- Authentication middleware for protected endpoints
- Secure handling of sensitive configuration data

#### Availability

- Graceful shutdown handling
- Health check endpoints for load balancers
- Error handling that doesn't expose internal details

#### Testability

- Unit tests for all business logic
- Integration tests for API endpoints
- High test coverage with meaningful assertions

#### Portability

- Containerization with Docker
- Environment-based configuration
- AWS Amplify deployment compatibility

---

### Coding Conventions

#### General

- No comments: code should be self-documenting and expressive
- Descriptive naming: variables, functions, and classes should clearly communicate their intent
- Use TypeScript strict mode and avoid `any` types
- Prefer `readonly` for immutable data structures

#### Testing

- 100% test coverage is required (enforced by Jest configuration)
- Tests should be meaningful and not just aim to increase coverage
- Mocks/stubs should be used where necessary to isolate behavior
- Tests should include only one assertion per test case
- Test names should be phrased as sentences clearly reflecting the behavior being asserted
  - **Example:** `should return 404 when user is not found`
- Integration tests are required for API endpoints
- Unit tests should isolate components and mock dependencies
- JUnit XML reports are generated for CI/CD integration

#### Static Analysis

Code must pass the following tools before merging:

| Tool         | Purpose                    |
| ------------ | -------------------------- |
| `ESLint`     | Linting and style checking |
| `Prettier`   | Code formatting            |
| `TypeScript` | Static type checking       |
| `Jest`       | Test coverage and quality  |

#### API Design

- RESTful endpoint design
- Consistent HTTP status codes
- JSON request/response format
- Authentication via Basic Auth (configurable)
- Proper error response structure

---

### Scripts and Commands

#### Development

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

#### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run architecture tests
npm run test:architecture

# Run complete test suite (all quality checks)
npm run test:all

# Run CI pipeline locally
npm run ci
```

#### Code Quality

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Format code
npm run format

# Type checking
npm run typecheck

# Validate architecture dependencies
npm run arch:validate
```

#### Security

```bash
# Run security audit
npm run security:audit
```

#### Utilities

```bash
# Clean build artifacts
npm run clean

# Install git hooks
npm run prepare
```

---

### Deployment

#### AWS Amplify

This project is designed for deployment on AWS Amplify, providing:

- **Automated CI/CD**: Git-based deployments with branch-specific environments
- **Environment Management**: Support for development, staging, and production environments
- **Serverless Architecture**: Automatic scaling and managed infrastructure
- **Built-in Authentication**: Integration with AWS Cognito for user management
- **API Gateway Integration**: RESTful API deployment with built-in security

#### Environment Variables

Configure the following environment variables in your deployment:

```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info
```

#### Health Checks

The application provides health check endpoints for monitoring:

- `GET /api/health` - Returns system health status
- Includes memory usage, system uptime, and application status
- Returns appropriate HTTP status codes (200, 503) for load balancer integration

---

### API Documentation

#### OpenAPI Specification

The API is fully documented using OpenAPI 3.0 specifications:

- OpenAPI spec is automatically generated from JSDoc comments in the code
- Swagger documentation includes request/response schemas and examples
- Specification file is generated during build process as `build/{version}.json`

#### Authentication

All user-related endpoints require Basic Authentication:

```bash
# Default credentials (configurable)
Username: admin
Password: password

# Example request header
Authorization: Basic YWRtaW46cGFzc3dvcmQ=
```

#### Health Endpoint

```bash
GET /api/health
```

Returns system health status including memory usage and uptime.

#### User Endpoints

```bash
# Create a new user
POST /api/users
Content-Type: application/json
Authorization: Basic <credentials>

{
  "email": "user@example.com",
  "name": "John Doe",
  "id": "optional-custom-id"
}

# Get user by ID
GET /api/users/{id}
Authorization: Basic <credentials>
```
