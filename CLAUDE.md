# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

This is a training project ("Library API") built as part of onboarding for the KROS Masha project. It follows the patterns from **Kros.AspNetCore.BestPractices** (`C:\Users\grego\RiderProjects\Kros.AspNetCore.BestPractices`). The goal is to replicate the Masha/KROS stack in miniature: first backend, then Angular frontend.

The onboarding spec is in `Onboarding_Novy_Developer.pdf` at the repo root.

## Build & Run Commands

```bash
dotnet build Library.slnx
dotnet run --project src/Library.Api
dotnet test Library.slnx
dotnet test Library.slnx --filter "FullyQualifiedName~CreateLoanCommandHandlerTests.Handle_BookAvailable_CreatesLoan"
dotnet test tests/Library.Api.Tests
```

Swagger UI at `/swagger` in Development mode.

## Architecture

.NET 10 Web API using **CQRS with MediatR**, modeled after Kros.AspNetCore.BestPractices (specifically the Kros.ToDos.Api service).

### Layers (all within `src/Library.Api`)

- **Domain** (`Domain/`) — Entity classes (`Book`, `Category`, `Member`, `Loan`) and repository interfaces. No business logic here.
- **Application** (`Application/`) — CQRS layer:
  - `Commands/{Entity}/` — Command classes (`IRequest<T>`), handlers (`IRequestHandler`), and FluentValidation validators.
  - `Queries/{Entity}/` — Query records with **nested DTO classes** (same pattern as BestPractices). A single query handler per entity handles both get-by-id and get-all.
  - `Controllers/` — Thin controllers delegating entirely to MediatR. One per entity.
  - `Behaviors/` — MediatR pipeline behaviors (`ValidationBehavior` for automatic FluentValidation).
- **Infrastructure** (`Infrastructure/`) — In-memory repository implementations using `ConcurrentDictionary`. Registered as singletons, designed to be swapped for Kros.KORM later.

### Key Patterns (aligned with Kros.AspNetCore.BestPractices)

- **Commands** return `long` (created ID) or `Unit`. **Queries** return DTOs nested inside the query record.
- **Mapster** for entity-to-DTO mapping (`.Adapt<T>()`), no explicit mapping config.
- **FluentValidation** validators auto-discovered and run via `ValidationBehavior` in the MediatR pipeline.
- **Scrutor** for assembly scanning / DI registration.
- Domain/business rules (max 5 active loans, book availability) live in **command handlers**, not domain entities.
- Controller actions should be thin — extract IDs from route, set them on the command, send via MediatR.

### Reference Project

When adding new features, refer to `C:\Users\grego\RiderProjects\Kros.AspNetCore.BestPractices` for:
- CQRS command/query structure (see `Kros.ToDos.Api/Application/`)
- Pipeline behaviors for cross-cutting concerns (see `Commands/PipeLines/`)
- Repository pattern with KORM (future migration target)
- MediatR notifications for cache invalidation / events
- Validation rule extension methods for reuse

### Tests

- **xUnit** + **NSubstitute** for mocking + **FluentAssertions** for assertions.
- Tests mock repository interfaces and test command handler logic directly.
- Follow the pattern in `CreateLoanCommandHandlerTests.cs` — constructor-injected mocks, `[Fact]` methods, `.Should()` assertions.

## Planned Evolution

1. **Current**: In-memory repositories, backend CRUD + business rules
2. **Next**: Swap to Kros.KORM with SQL Server (migration scripts in embedded resources)
3. **Later**: Angular SPA frontend (Angular 15 + PrimeNG + NgRx, then upgrade path to 20/21)
4. **Optional**: Azure Function (timer trigger, e.g., daily CSV export)