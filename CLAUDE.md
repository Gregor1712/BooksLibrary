# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

This is a training project ("Library API") built as part of onboarding for the KROS Masha project. The goal is to replicate the Masha/KROS stack in miniature: first backend, then Angular frontend.

The onboarding spec is in `Onboarding_Novy_Developer.pdf` at the repo root.

## Build & Run Commands

```bash
dotnet build BooksLibrary.slnx
dotnet run --project src/BooksLibrary.Api
dotnet test BooksLibrary.slnx
dotnet test BooksLibrary.slnx --filter "FullyQualifiedName~CreateLoanCommandHandlerTests.Handle_BookAvailable_CreatesLoan"
dotnet test tests/BooksLibrary.Api.Tests
```

Swagger UI at `/swagger` in Development mode.

Requires a local SQL Server instance (`localhost`, integrated security) with an empty `BooksLibraryDB` database — schema and seed data are auto-applied on first run.

Frontend (from `src/BooksLibrary.WebApp`):

```bash
npm start                                            # ng serve with API proxy on :4200
npm test -- --watch=false --browsers=ChromeHeadless  # Karma single run
npm run build
```

## Architecture

.NET 10 Web API using **CQRS with MediatR**.

### Layers (all within `src/BooksLibrary.Api`)

- **Domain** (`Domain/`) — Entity classes (`Book`, `Category`, `Member`, `Loan`) and repository interfaces. No business logic here.
- **Application** (`Application/`) — CQRS layer:
  - `Commands/{Entity}/` — Command classes (`IRequest<T>`), handlers (`IRequestHandler`), and FluentValidation validators.
  - `Queries/{Entity}/` — Query records with **nested DTO classes**. A single query handler per entity handles both get-by-id and get-all.
  - `Controllers/` — Thin controllers delegating entirely to MediatR. One per entity.
  - `Behaviors/` — MediatR pipeline behaviors (`ValidationBehavior` for automatic FluentValidation).
- **Infrastructure** (`Infrastructure/`) — Kros.KORM repository implementations backed by SQL Server. Auto-registered via Scrutor.

### Key Patterns

- **Commands** return `long` (created ID) or `Unit`. **Queries** return DTOs nested inside the query record.
- **Mapster** for entity-to-DTO mapping (`.Adapt<T>()`), no explicit mapping config.
- **FluentValidation** validators auto-discovered and run via `ValidationBehavior` in the MediatR pipeline.
- **Scrutor** for assembly scanning / DI registration.
- Domain/business rules (max 5 active loans, book availability) live in **command handlers**, not domain entities.
- Controller actions should be thin — extract IDs from route, set them on the command, send via MediatR.

### Frontend (`src/BooksLibrary.WebApp`)

Angular 15 + PrimeNG 15 + NgRx 15 + ngrx-forms (deliberately legacy — mirrors Masha before its upgrade).
`core/` (API services, error interceptor), `shared/` (PrimeNG re-exports), lazy `books/` and `loans/`
feature modules each with their own NgRx slice (`store/` folder: actions, reducer with ngrx-forms,
selectors incl. view-model joins, effects). Dev proxy `proxy.conf.json` forwards `/api` to the .NET API
(`http://localhost:5087`) — start the API before `npm start`.

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

1. **Done**: Backend CRUD + business rules with Kros.KORM + SQL Server
2. **In progress**: Angular SPA frontend (Angular 15 + PrimeNG + NgRx; Books + Loans done, Members/Categories screens and the upgrade path to 20/21 pending)
3. **Optional**: Azure Function (timer trigger, e.g., daily CSV export)