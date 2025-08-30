# Technical Assumptions

## Repository Structure: Monorepo

Single repository containing all services, shared libraries, and deployment configurations. Clear package boundaries with `apps/` for services, `packages/` for shared code, `infrastructure/` for IaC. Yarn workspaces for dependency management and build orchestration.

## Service Architecture

Microservices architecture within the monorepo:
- **API Gateway** - Request routing, authentication, rate limiting
- **Auth Service** - User management, authentication, authorization  
- **Matching Engine** - AI/ML processing for candidate-job matching
- **Assessment Service** - Test delivery, scoring, and analytics
- **Notification Service** - Email, in-app, and webhook notifications
- **Job Service** - Job posting CRUD and management
- **Application Service** - Application workflow and status tracking
- **Profile Service** - Candidate and employer profile management

Services communicate via REST APIs and async messaging (AWS SQS/Google Pub/Sub) for decoupling. Each service has its own database following database-per-service pattern.

## Testing Requirements

Comprehensive testing pyramid:
- **Unit Tests** - 80% coverage for business logic
- **Integration Tests** - API endpoint and service interaction testing
- **E2E Tests** - Critical user journeys using Playwright
- **Performance Tests** - Load testing for scalability validation
- **Security Tests** - OWASP top 10 and penetration testing
- **AI Model Tests** - Accuracy, bias, and drift detection
- **Manual Testing** - Convenience methods for QA team

Automated testing in CI/CD pipeline with quality gates blocking deployment.

## Additional Technical Assumptions and Requests

- Use Next.js 14+ with App Router for frontend application
- Implement TypeScript throughout for type safety
- Supabase PostgreSQL for transactional data, Redis for caching
- Vector database (Supabase/Pinecone/Weaviate) for AI embeddings
- Python microservices for ML/AI components using FastAPI
- Infrastructure as Code using Terraform
- Container orchestration with Kubernetes
- GitHub Actions for CI/CD pipelines
- Monitoring with DataDog or New Relic
- Error tracking with Sentry
- Feature flags using LaunchDarkly or similar
- CDN for static assets and global distribution