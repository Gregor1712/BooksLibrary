# Kros.KORM Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace in-memory repositories with Kros.KORM-backed SQL Server repositories.

**Architecture:** Add KORM NuGet packages, create SQL migration scripts as embedded resources, implement a `DatabaseConfiguration` class that maps entities to tables, write 4 KORM repository classes that implement the existing interfaces using `IDatabase`, and wire everything in `Program.cs`. The existing repository interfaces, domain entities, command/query handlers, and tests remain unchanged.

**Tech Stack:** Kros.KORM 6.2.0, Kros.KORM.Extensions.Asp 1.3.1, SQL Server (localhost), .NET 10

**Spec:** `docs/superpowers/specs/2026-06-08-kros-korm-integration-design.md`

---

### Task 1: Add NuGet Packages

**Files:**
- Modify: `src/Library.Api/Library.Api.csproj`

- [ ] **Step 1: Add Kros.KORM packages**

Run:
```bash
cd C:/Users/grego/RiderProjects/Library && dotnet add src/Library.Api package Kros.KORM && dotnet add src/Library.Api package Kros.KORM.Extensions.Asp
```

- [ ] **Step 2: Verify the project builds**

Run:
```bash
dotnet build Library.slnx
```
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add src/Library.Api/Library.Api.csproj
git commit -m "feat: add Kros.KORM and Kros.KORM.Extensions.Asp NuGet packages"
```

---

### Task 2: Add Connection String

**Files:**
- Modify: `src/Library.Api/appsettings.json` (or create `appsettings.Development.json` if it doesn't exist)

- [ ] **Step 1: Add ConnectionStrings section to appsettings.json**

Add the `ConnectionStrings` section to the existing `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=BooksLibraryDB;TrustServerCertificate=true;Integrated Security=False;Trusted_Connection=True"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

Keep existing content, just add the `ConnectionStrings` block at the top.

- [ ] **Step 2: Commit**

```bash
git add src/Library.Api/appsettings.json
git commit -m "feat: add DefaultConnection connection string for SQL Server"
```

---

### Task 3: Create SQL Migration Scripts

**Files:**
- Create: `src/Library.Api/SqlScripts/20260608001_CreateCategoriesTable.sql`
- Create: `src/Library.Api/SqlScripts/20260608002_CreateBooksTable.sql`
- Create: `src/Library.Api/SqlScripts/20260608003_CreateMembersTable.sql`
- Create: `src/Library.Api/SqlScripts/20260608004_CreateLoansTable.sql`
- Modify: `src/Library.Api/Library.Api.csproj` (add EmbeddedResource entries)

- [ ] **Step 1: Create SqlScripts directory**

```bash
mkdir -p C:/Users/grego/RiderProjects/Library/src/Library.Api/SqlScripts
```

- [ ] **Step 2: Create Categories table script**

Create `src/Library.Api/SqlScripts/20260608001_CreateCategoriesTable.sql`:

```sql
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[Categories](
    [Id] bigint IDENTITY(1,1) NOT NULL,
    [Name] nvarchar(255) NOT NULL,
    [Description] nvarchar(500) NULL,
 CONSTRAINT [PK_Categories] PRIMARY KEY CLUSTERED
(
    [Id] ASC
) ON [PRIMARY]
) ON [PRIMARY]
GO
```

- [ ] **Step 3: Create Books table script**

Create `src/Library.Api/SqlScripts/20260608002_CreateBooksTable.sql`:

```sql
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[Books](
    [Id] bigint IDENTITY(1,1) NOT NULL,
    [Title] nvarchar(255) NOT NULL,
    [Author] nvarchar(255) NOT NULL,
    [ISBN] nvarchar(20) NOT NULL,
    [Year] int NOT NULL,
    [CategoryId] bigint NOT NULL,
    [IsAvailable] bit NOT NULL CONSTRAINT [DF_Books_IsAvailable] DEFAULT 1,
    [Created] datetime2(7) NULL,
    [LastChange] datetime2(7) NULL,
 CONSTRAINT [PK_Books] PRIMARY KEY CLUSTERED
(
    [Id] ASC
) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[Books] WITH CHECK ADD CONSTRAINT [FK_Books_Categories]
    FOREIGN KEY([CategoryId]) REFERENCES [dbo].[Categories] ([Id])
GO
```

- [ ] **Step 4: Create Members table script**

Create `src/Library.Api/SqlScripts/20260608003_CreateMembersTable.sql`:

```sql
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[Members](
    [Id] bigint IDENTITY(1,1) NOT NULL,
    [FirstName] nvarchar(100) NOT NULL,
    [LastName] nvarchar(100) NOT NULL,
    [Email] nvarchar(255) NOT NULL,
 CONSTRAINT [PK_Members] PRIMARY KEY CLUSTERED
(
    [Id] ASC
) ON [PRIMARY]
) ON [PRIMARY]
GO
```

- [ ] **Step 5: Create Loans table script**

Create `src/Library.Api/SqlScripts/20260608004_CreateLoansTable.sql`:

```sql
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[Loans](
    [Id] bigint IDENTITY(1,1) NOT NULL,
    [BookId] bigint NOT NULL,
    [MemberId] bigint NOT NULL,
    [LoanDate] datetimeoffset(7) NOT NULL,
    [DueDate] datetimeoffset(7) NOT NULL,
    [ReturnDate] datetimeoffset(7) NULL,
    [IsReturned] bit NOT NULL CONSTRAINT [DF_Loans_IsReturned] DEFAULT 0,
 CONSTRAINT [PK_Loans] PRIMARY KEY CLUSTERED
(
    [Id] ASC
) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[Loans] WITH CHECK ADD CONSTRAINT [FK_Loans_Books]
    FOREIGN KEY([BookId]) REFERENCES [dbo].[Books] ([Id])
GO

ALTER TABLE [dbo].[Loans] WITH CHECK ADD CONSTRAINT [FK_Loans_Members]
    FOREIGN KEY([MemberId]) REFERENCES [dbo].[Members] ([Id])
GO
```

- [ ] **Step 6: Add EmbeddedResource entries to csproj**

Add the following to `src/Library.Api/Library.Api.csproj` inside the `<Project>` element, after the existing `<ItemGroup>`:

```xml
<ItemGroup>
  <None Remove="SqlScripts\20260608001_CreateCategoriesTable.sql" />
  <None Remove="SqlScripts\20260608002_CreateBooksTable.sql" />
  <None Remove="SqlScripts\20260608003_CreateMembersTable.sql" />
  <None Remove="SqlScripts\20260608004_CreateLoansTable.sql" />
</ItemGroup>

<ItemGroup>
  <EmbeddedResource Include="SqlScripts\20260608001_CreateCategoriesTable.sql" />
  <EmbeddedResource Include="SqlScripts\20260608002_CreateBooksTable.sql" />
  <EmbeddedResource Include="SqlScripts\20260608003_CreateMembersTable.sql" />
  <EmbeddedResource Include="SqlScripts\20260608004_CreateLoansTable.sql" />
</ItemGroup>
```

- [ ] **Step 7: Verify project builds**

Run:
```bash
dotnet build Library.slnx
```
Expected: Build succeeded.

- [ ] **Step 8: Commit**

```bash
git add src/Library.Api/SqlScripts/ src/Library.Api/Library.Api.csproj
git commit -m "feat: add SQL migration scripts for Categories, Books, Members, Loans tables"
```

---

### Task 4: Create DatabaseConfiguration

**Files:**
- Create: `src/Library.Api/Infrastructure/DatabaseConfiguration.cs`

- [ ] **Step 1: Create DatabaseConfiguration class**

Create `src/Library.Api/Infrastructure/DatabaseConfiguration.cs`:

```csharp
using Kros.KORM;
using Kros.KORM.Metadata;
using Library.Api.Domain;

namespace Library.Api.Infrastructure;

public class DatabaseConfiguration : DatabaseConfigurationBase
{
    internal const string CategoriesTableName = "Categories";
    internal const string BooksTableName = "Books";
    internal const string MembersTableName = "Members";
    internal const string LoansTableName = "Loans";

    public override void OnModelCreating(ModelConfigurationBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>()
            .HasTableName(CategoriesTableName)
            .HasPrimaryKey(f => f.Id).AutoIncrement();

        modelBuilder.Entity<Book>()
            .HasTableName(BooksTableName)
            .HasPrimaryKey(f => f.Id).AutoIncrement();

        modelBuilder.Entity<Member>()
            .HasTableName(MembersTableName)
            .HasPrimaryKey(f => f.Id).AutoIncrement();

        modelBuilder.Entity<Loan>()
            .HasTableName(LoansTableName)
            .HasPrimaryKey(f => f.Id).AutoIncrement();
    }
}
```

- [ ] **Step 2: Verify project builds**

Run:
```bash
dotnet build Library.slnx
```
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add src/Library.Api/Infrastructure/DatabaseConfiguration.cs
git commit -m "feat: add DatabaseConfiguration mapping entities to KORM tables"
```

---

### Task 5: Create CategoryRepository (KORM)

**Files:**
- Create: `src/Library.Api/Infrastructure/CategoryRepository.cs`

- [ ] **Step 1: Create CategoryRepository**

Create `src/Library.Api/Infrastructure/CategoryRepository.cs`:

```csharp
using Kros.KORM;
using Library.Api.Domain;

namespace Library.Api.Infrastructure;

public class CategoryRepository : ICategoryRepository
{
    private readonly IDatabase _database;

    public CategoryRepository(IDatabase database)
    {
        _database = database;
    }

    public async Task<long> CreateAsync(Category category)
    {
        await _database.AddAsync(category);
        return category.Id;
    }

    public Task<Category?> GetByIdAsync(long id)
    {
        var category = _database.Query<Category>()
            .FirstOrDefault(c => c.Id == id);
        return Task.FromResult(category);
    }

    public Task<IEnumerable<Category>> GetAllAsync()
    {
        var categories = _database.Query<Category>().AsEnumerable();
        return Task.FromResult(categories);
    }

    public Task UpdateAsync(Category category)
        => _database.EditAsync(category);

    public Task DeleteAsync(long id)
        => _database.DeleteAsync<Category>(id);
}
```

- [ ] **Step 2: Verify project builds**

Run:
```bash
dotnet build Library.slnx
```
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add src/Library.Api/Infrastructure/CategoryRepository.cs
git commit -m "feat: add KORM-backed CategoryRepository"
```

---

### Task 6: Create BookRepository (KORM)

**Files:**
- Create: `src/Library.Api/Infrastructure/BookRepository.cs`

- [ ] **Step 1: Create BookRepository**

Create `src/Library.Api/Infrastructure/BookRepository.cs`:

```csharp
using Kros.KORM;
using Library.Api.Domain;

namespace Library.Api.Infrastructure;

public class BookRepository : IBookRepository
{
    private readonly IDatabase _database;

    public BookRepository(IDatabase database)
    {
        _database = database;
    }

    public async Task<long> CreateAsync(Book book)
    {
        await _database.AddAsync(book);
        return book.Id;
    }

    public Task<Book?> GetByIdAsync(long id)
    {
        var book = _database.Query<Book>()
            .FirstOrDefault(b => b.Id == id);
        return Task.FromResult(book);
    }

    public Task<IEnumerable<Book>> GetAllAsync()
    {
        var books = _database.Query<Book>().AsEnumerable();
        return Task.FromResult(books);
    }

    public Task UpdateAsync(Book book)
        => _database.EditAsync(book);

    public Task DeleteAsync(long id)
        => _database.DeleteAsync<Book>(id);
}
```

- [ ] **Step 2: Verify project builds**

Run:
```bash
dotnet build Library.slnx
```
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add src/Library.Api/Infrastructure/BookRepository.cs
git commit -m "feat: add KORM-backed BookRepository"
```

---

### Task 7: Create MemberRepository (KORM)

**Files:**
- Create: `src/Library.Api/Infrastructure/MemberRepository.cs`

- [ ] **Step 1: Create MemberRepository**

Create `src/Library.Api/Infrastructure/MemberRepository.cs`:

```csharp
using Kros.KORM;
using Library.Api.Domain;

namespace Library.Api.Infrastructure;

public class MemberRepository : IMemberRepository
{
    private readonly IDatabase _database;

    public MemberRepository(IDatabase database)
    {
        _database = database;
    }

    public async Task<long> CreateAsync(Member member)
    {
        await _database.AddAsync(member);
        return member.Id;
    }

    public Task<Member?> GetByIdAsync(long id)
    {
        var member = _database.Query<Member>()
            .FirstOrDefault(m => m.Id == id);
        return Task.FromResult(member);
    }

    public Task<IEnumerable<Member>> GetAllAsync()
    {
        var members = _database.Query<Member>().AsEnumerable();
        return Task.FromResult(members);
    }

    public Task UpdateAsync(Member member)
        => _database.EditAsync(member);

    public Task DeleteAsync(long id)
        => _database.DeleteAsync<Member>(id);
}
```

- [ ] **Step 2: Verify project builds**

Run:
```bash
dotnet build Library.slnx
```
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add src/Library.Api/Infrastructure/MemberRepository.cs
git commit -m "feat: add KORM-backed MemberRepository"
```

---

### Task 8: Create LoanRepository (KORM)

**Files:**
- Create: `src/Library.Api/Infrastructure/LoanRepository.cs`

This is the most complex repository — it has extra query methods (`GetActiveByMemberIdAsync`, `GetActiveByBookIdAsync`) and no `DeleteAsync`.

- [ ] **Step 1: Create LoanRepository**

Create `src/Library.Api/Infrastructure/LoanRepository.cs`:

```csharp
using Kros.KORM;
using Library.Api.Domain;

namespace Library.Api.Infrastructure;

public class LoanRepository : ILoanRepository
{
    private readonly IDatabase _database;

    public LoanRepository(IDatabase database)
    {
        _database = database;
    }

    public async Task<long> CreateAsync(Loan loan)
    {
        await _database.AddAsync(loan);
        return loan.Id;
    }

    public Task<Loan?> GetByIdAsync(long id)
    {
        var loan = _database.Query<Loan>()
            .FirstOrDefault(l => l.Id == id);
        return Task.FromResult(loan);
    }

    public Task<IEnumerable<Loan>> GetAllAsync()
    {
        var loans = _database.Query<Loan>().AsEnumerable();
        return Task.FromResult(loans);
    }

    public Task<IEnumerable<Loan>> GetActiveByMemberIdAsync(long memberId)
    {
        var loans = _database.Query<Loan>()
            .Where(l => l.MemberId == memberId && !l.IsReturned)
            .AsEnumerable();
        return Task.FromResult(loans);
    }

    public Task<Loan?> GetActiveByBookIdAsync(long bookId)
    {
        var loan = _database.Query<Loan>()
            .FirstOrDefault(l => l.BookId == bookId && !l.IsReturned);
        return Task.FromResult(loan);
    }

    public Task UpdateAsync(Loan loan)
        => _database.EditAsync(loan);
}
```

- [ ] **Step 2: Verify project builds**

Run:
```bash
dotnet build Library.slnx
```
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add src/Library.Api/Infrastructure/LoanRepository.cs
git commit -m "feat: add KORM-backed LoanRepository with active loan queries"
```

---

### Task 9: Wire KORM in Program.cs and Remove In-Memory Repos

**Files:**
- Modify: `src/Library.Api/Program.cs`
- Delete: `src/Library.Api/Infrastructure/InMemoryBookRepository.cs`
- Delete: `src/Library.Api/Infrastructure/InMemoryCategoryRepository.cs`
- Delete: `src/Library.Api/Infrastructure/InMemoryMemberRepository.cs`
- Delete: `src/Library.Api/Infrastructure/InMemoryLoanRepository.cs`

- [ ] **Step 1: Update Program.cs**

Replace the full contents of `src/Library.Api/Program.cs` with:

```csharp
using FluentValidation;
using Library.Api.Application.Behaviors;
using MediatR;

var builder = WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// MediatR
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssemblyContaining<Program>());

// FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

// KORM Database
builder.Services.AddKormDatabase(builder.Configuration);

// Auto-register repositories via Scrutor (matches IXxxRepository → XxxRepository)
builder.Services.Scan(scan =>
    scan.FromCallingAssembly()
        .AddClasses()
        .AsMatchingInterface());

var app = builder.Build();

// Middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseKormMigrations();
app.MapControllers();

app.Run();
```

Key changes:
- Removed `using Library.Api.Domain;` and `using Library.Api.Infrastructure;` (no longer needed)
- Removed 4 `AddSingleton` repository lines
- Added `builder.Services.AddKormDatabase(builder.Configuration)`
- Added Scrutor `services.Scan()` for auto-registration
- Added `app.UseKormMigrations()` before `MapControllers()`

- [ ] **Step 2: Delete in-memory repository files**

```bash
rm C:/Users/grego/RiderProjects/Library/src/Library.Api/Infrastructure/InMemoryBookRepository.cs
rm C:/Users/grego/RiderProjects/Library/src/Library.Api/Infrastructure/InMemoryCategoryRepository.cs
rm C:/Users/grego/RiderProjects/Library/src/Library.Api/Infrastructure/InMemoryMemberRepository.cs
rm C:/Users/grego/RiderProjects/Library/src/Library.Api/Infrastructure/InMemoryLoanRepository.cs
```

- [ ] **Step 3: Verify project builds**

Run:
```bash
dotnet build Library.slnx
```
Expected: Build succeeded.

- [ ] **Step 4: Run existing tests**

Run:
```bash
dotnet test Library.slnx
```
Expected: All tests pass (they mock interfaces, so KORM is irrelevant).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: wire KORM database in Program.cs, remove in-memory repositories"
```

---

### Task 10: Smoke Test — Run the API

**Files:** None (manual verification)

- [ ] **Step 1: Start the API**

Run:
```bash
dotnet run --project src/Library.Api
```

Expected: App starts without errors. KORM runs the 4 migration scripts and creates the tables in `BooksLibraryDB`.

- [ ] **Step 2: Test via Swagger**

Open `https://localhost:<port>/swagger` in the browser. Test the following sequence:

1. POST `/api/categories` — create a category, verify 201 with an ID
2. GET `/api/categories` — verify the created category is returned
3. POST `/api/books` — create a book (using the category ID from step 1)
4. GET `/api/books/{id}` — verify the book is returned
5. POST `/api/members` — create a member
6. POST `/api/loans` — create a loan (book ID + member ID)
7. GET `/api/loans` — verify the loan appears

- [ ] **Step 3: Commit (if any fixes were needed)**

Only if adjustments were required during smoke testing.
