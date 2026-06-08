# Library API

A .NET 10 Web API for managing a library system — books, categories, members, and loans. Built as a training project following the [Kros.AspNetCore.BestPractices](https://github.com/Kros-sk/Kros.AspNetCore.BestPractices) architecture (CQRS + MediatR + FluentValidation + Mapster).

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)

## Getting Started

```bash
# Build
dotnet build Library.slnx

# Run (Swagger UI at /swagger in Development)
dotnet run --project src/Library.Api
```

## API Endpoints

| Resource   | Endpoints                                                                    |
|----------- |----------------------------------------------------------------------------- |
| Books      | `GET /api/books`, `GET /api/books/{id}`, `POST`, `PUT`, `DELETE`             |
| Categories | `GET /api/categories`, `GET /api/categories/{id}`, `POST`, `PUT`, `DELETE`   |
| Members    | `GET /api/members`, `GET /api/members/{id}`, `POST`, `PUT`, `DELETE`         |
| Loans      | `GET /api/loans`, `GET /api/loans/{id}`, `POST`, `PUT /api/loans/{id}/return`|

## Business Rules

- A member can have a maximum of **5 active loans** at a time.
- A book must be **available** to be loaned out. Loaning marks it unavailable; returning restores availability.
- Default loan period is **14 days**.

## Running Tests

```bash
# All tests
dotnet test Library.slnx

# Single test
dotnet test Library.slnx --filter "FullyQualifiedName~CreateLoanCommandHandlerTests.Handle_BookAvailable_CreatesLoan"
```

## Tech Stack

| Layer       | Technology                          |
|------------ |------------------------------------ |
| Framework   | ASP.NET Core (.NET 10)              |
| CQRS        | MediatR                             |
| Validation  | FluentValidation (pipeline behavior)|
| Mapping     | Mapster                             |
| DI scanning | Scrutor                             |
| API docs    | Swashbuckle (Swagger)               |
| Tests       | xUnit + NSubstitute + FluentAssertions |

## Data Storage

Repositories are currently **in-memory** (`ConcurrentDictionary`). Data does not persist across restarts. The repository interfaces in `Domain/` are designed to be swapped for [Kros.KORM](https://github.com/Kros-sk/Kros.KORM) persistent implementations.

## Roadmap

1. Backend CRUD + business rules (current)
2. Swap to Kros.KORM with SQL Server
3. Angular SPA frontend (Angular 15 + PrimeNG + NgRx)
4. Angular upgrade path (15 → 20/21)