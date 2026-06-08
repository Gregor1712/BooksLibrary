# Add Kros.KORM to Library API

## Goal

Replace in-memory `ConcurrentDictionary` repositories with Kros.KORM-backed SQL Server repositories, following the patterns from Kros.AspNetCore.BestPractices.

## Database

- **Server:** `localhost` (SQL Server, Windows auth)
- **Database:** `BooksLibraryDB`
- **Connection string key:** `DefaultConnection`

## NuGet Packages

Add to `Library.Api.csproj`:
- `Kros.KORM`
- `Kros.KORM.Extensions.Asp`

## SQL Migration Scripts

Embedded resources in `SqlScripts/`, named with `YYYYMMDDNNN_Description.sql` convention. Order matters for FK dependencies.

| Script | Table | Notes |
|--------|-------|-------|
| `20260608001_CreateCategoriesTable.sql` | Categories | No FKs |
| `20260608002_CreateBooksTable.sql` | Books | FK → Categories |
| `20260608003_CreateMembersTable.sql` | Members | No FKs |
| `20260608004_CreateLoansTable.sql` | Loans | FK → Books, FK → Members |

### Table Schemas

**Categories:**
- `Id` bigint IDENTITY(1,1) PK
- `Name` nvarchar(255) NOT NULL
- `Description` nvarchar(500) NULL

**Books:**
- `Id` bigint IDENTITY(1,1) PK
- `Title` nvarchar(255) NOT NULL
- `Author` nvarchar(255) NOT NULL
- `ISBN` nvarchar(20) NOT NULL
- `Year` int NOT NULL
- `CategoryId` bigint NOT NULL (FK → Categories.Id)
- `IsAvailable` bit NOT NULL DEFAULT 1
- `Created` datetime2(7) NULL
- `LastChange` datetime2(7) NULL

**Members:**
- `Id` bigint IDENTITY(1,1) PK
- `FirstName` nvarchar(100) NOT NULL
- `LastName` nvarchar(100) NOT NULL
- `Email` nvarchar(255) NOT NULL

**Loans:**
- `Id` bigint IDENTITY(1,1) PK
- `BookId` bigint NOT NULL (FK → Books.Id)
- `MemberId` bigint NOT NULL (FK → Members.Id)
- `LoanDate` datetimeoffset(7) NOT NULL
- `DueDate` datetimeoffset(7) NOT NULL
- `ReturnDate` datetimeoffset(7) NULL
- `IsReturned` bit NOT NULL DEFAULT 0

## DatabaseConfiguration

New file: `Infrastructure/DatabaseConfiguration.cs`

- Extends `DatabaseConfigurationBase` (from Kros.KORM)
- `OnModelCreating` maps each entity to its table with `HasPrimaryKey(f => f.Id).AutoIncrement()`
- Defines `const` table name strings

## KORM Repository Implementations

Replace `InMemory*Repository` files with KORM-backed implementations. Each injects `IDatabase`.

**Repository interfaces stay unchanged.** The KORM implementations must satisfy the existing contracts.

| File | Replaces | Interface |
|------|----------|-----------|
| `BookRepository.cs` | `InMemoryBookRepository.cs` | `IBookRepository` |
| `CategoryRepository.cs` | `InMemoryCategoryRepository.cs` | `ICategoryRepository` |
| `MemberRepository.cs` | `InMemoryMemberRepository.cs` | `IMemberRepository` |
| `LoanRepository.cs` | `InMemoryLoanRepository.cs` | `ILoanRepository` |

### Key implementation details

- **CreateAsync returning `Task<long>`:** Use `_database.AddAsync(entity)`, then retrieve the inserted ID. KORM sets the ID on the entity when using AutoIncrement, so return `entity.Id` after the add.
- **GetByIdAsync:** Use `_database.Query<T>().FirstOrDefault(e => e.Id == id)` or raw SQL `SELECT ... WHERE Id = @id`.
- **GetAllAsync:** Use `_database.Query<T>()` to return all rows.
- **UpdateAsync:** Use `_database.EditAsync(entity)`.
- **DeleteAsync:** Use `_database.DeleteAsync<T>(id)`.
- **LoanRepository extras** (e.g., `GetActiveLoansByMemberIdAsync`, `GetActiveLoanByBookIdAsync`): Use KORM `Query<T>()` with SQL WHERE clauses.

## Program.cs Changes

1. Remove the 4 `AddSingleton<I*Repository, InMemory*Repository>()` lines
2. Add `services.AddKormDatabase(Configuration)` — registers `IDatabase` from the `DefaultConnection` string
3. Add `app.UseKormMigrations()` — runs embedded SQL scripts on startup
4. Scrutor's `AsMatchingInterface()` scan auto-registers the new repositories (already present or to be added)

## Configuration Files

**appsettings.json** — add:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=BooksLibraryDB;TrustServerCertificate=true;Integrated Security=False;Trusted_Connection=True"
  }
}
```

## What Does NOT Change

- Domain entities (`Book`, `Category`, `Member`, `Loan`)
- Repository interfaces (`IBookRepository`, etc.)
- Command/query handlers
- Controllers
- Validators
- `ValidationBehavior`
- Existing tests (they mock repository interfaces)

## Deleted Files

- `Infrastructure/InMemoryBookRepository.cs`
- `Infrastructure/InMemoryCategoryRepository.cs`
- `Infrastructure/InMemoryMemberRepository.cs`
- `Infrastructure/InMemoryLoanRepository.cs`
