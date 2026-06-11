# Angular Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Angular 15 SPA (PrimeNG 15, NgRx 15, ngrx-forms) with Books CRUD and Loans screens consuming the BooksLibrary .NET API, per the approved spec `docs/superpowers/specs/2026-06-11-angular-frontend-design.md`.

**Architecture:** Angular CLI workspace at `src/BooksLibrary.WebApp` with CoreModule (API services, error interceptor), SharedModule (PrimeNG re-exports), and lazy-loaded BooksModule/LoansModule, each owning an NgRx feature slice (Entity adapter + ngrx-forms dialog form). Two small backend tasks first: an exception-mapping middleware (handler exceptions are currently 500s) and `CategoryId` on the book list DTO.

**Tech Stack:** Angular 15.2, PrimeNG 15, NgRx 15 (Store/Effects/Entity/Router-Store), ngrx-forms 8, RxJS 7, Karma+Jasmine. Backend: .NET 10, xUnit, NSubstitute, FluentAssertions.

**Deviations from spec (discovered during backend contract review):**
- Business-rule violations (`InvalidOperationException`) map to **409**, validation to **400**, not-found to **404** — a new `ApiExceptionMiddleware` does this (today they're all 500).
- `GetAllBooksQuery.BookListItem` gains `CategoryId` (one property; Mapster maps it automatically) so the Books table can show a Category column.
- The loans detail DTO has no member name and no return date — member name is joined **client-side** from the members lookup; the Status column shows Active/Overdue/Returned (no return date).
- Categories load on Books **page** open (the table's Category column needs them), not only on dialog open.

**Environment notes:**
- Backend commands run from repo root (`C:\Users\GP\RiderProjects\BooksLibrary`). Frontend commands run from `src/BooksLibrary.WebApp` unless stated otherwise.
- API dev URL: `http://localhost:5087` (from `launchSettings.json`); SPA dev URL: `http://localhost:4200` with proxy for `/api`.
- Backend JSON is camelCase: `ISBN` → `isbn`, `IsOverdue` → `isOverdue`. `LoanDetailListItem.Book` serializes as a nested `book` object (can be `null` if the book lookup misses).
- Node v24 is installed; Angular 15 CLI accepts `>=18.10`. If `ng new`/`ng build` hits a Node compatibility error, install Node 18 LTS (e.g. via nvm-windows) and retry.
- Frontend tests: `npm test -- --watch=false --browsers=ChromeHeadless` (requires Chrome). Backend tests: `dotnet test BooksLibrary.slnx`.

---

### Task 1: Backend — ApiExceptionMiddleware

Maps handler exceptions to HTTP statuses with a ProblemDetails-style JSON body `{ status, title, detail }` that the frontend interceptor will read.

**Files:**
- Create: `src/BooksLibrary.Api/Infrastructure/Middleware/ApiExceptionMiddleware.cs`
- Modify: `src/BooksLibrary.Api/Program.cs` (register middleware)
- Test: `tests/BooksLibrary.Api.Tests/ApiExceptionMiddlewareTests.cs`

- [ ] **Step 1: Write the failing tests**

```csharp
using System.Text.Json;
using BooksLibrary.Api.Infrastructure.Middleware;
using FluentAssertions;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Xunit;

namespace BooksLibrary.Api.Tests;

public class ApiExceptionMiddlewareTests
{
    [Fact]
    public async Task Handle_ValidationException_Returns400WithDetail()
    {
        var context = await InvokeWithExceptionAsync(new ValidationException("Title is required"));

        context.Response.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        var body = await ReadBodyAsync(context);
        body.GetProperty("detail").GetString().Should().Contain("Title is required");
    }

    [Fact]
    public async Task Handle_InvalidOperationException_Returns409WithDetail()
    {
        var context = await InvokeWithExceptionAsync(
            new InvalidOperationException("Member has reached the maximum of 5 active loans."));

        context.Response.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        var body = await ReadBodyAsync(context);
        body.GetProperty("detail").GetString()
            .Should().Be("Member has reached the maximum of 5 active loans.");
    }

    [Fact]
    public async Task Handle_KeyNotFoundException_Returns404()
    {
        var context = await InvokeWithExceptionAsync(new KeyNotFoundException("Book with id 99 not found."));

        context.Response.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Handle_UnknownException_Returns500WithGenericDetail()
    {
        var context = await InvokeWithExceptionAsync(new Exception("secret internals"));

        context.Response.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
        var body = await ReadBodyAsync(context);
        body.GetProperty("detail").GetString().Should().NotContain("secret internals");
    }

    [Fact]
    public async Task Handle_NoException_PassesThrough()
    {
        var middleware = new ApiExceptionMiddleware(_ => Task.CompletedTask);
        var context = new DefaultHttpContext();

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
    }

    private static async Task<HttpContext> InvokeWithExceptionAsync(Exception exception)
    {
        var middleware = new ApiExceptionMiddleware(_ => throw exception);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        await middleware.InvokeAsync(context);
        return context;
    }

    private static async Task<JsonElement> ReadBodyAsync(HttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body);
        var json = await reader.ReadToEndAsync();
        return JsonDocument.Parse(json).RootElement;
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run (repo root): `dotnet test BooksLibrary.slnx --filter "FullyQualifiedName~ApiExceptionMiddlewareTests"`
Expected: build FAILURE — `ApiExceptionMiddleware` does not exist.

- [ ] **Step 3: Implement the middleware**

```csharp
using FluentValidation;

namespace BooksLibrary.Api.Infrastructure.Middleware;

public class ApiExceptionMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            var (status, title, detail) = ex switch
            {
                ValidationException => (StatusCodes.Status400BadRequest, "Validation failed", ex.Message),
                KeyNotFoundException => (StatusCodes.Status404NotFound, "Not found", ex.Message),
                InvalidOperationException => (StatusCodes.Status409Conflict, "Business rule violation", ex.Message),
                _ => (StatusCodes.Status500InternalServerError, "Server error", "An unexpected error occurred."),
            };

            context.Response.StatusCode = status;
            context.Response.ContentType = "application/problem+json";
            await context.Response.WriteAsJsonAsync(new { status, title, detail });
        }
    }
}
```

- [ ] **Step 4: Register in Program.cs**

In `src/BooksLibrary.Api/Program.cs`, add the using and register the middleware immediately after `var app = builder.Build();` block's `app.UseHttpsRedirection();` line:

```csharp
// at the top with the other usings:
using BooksLibrary.Api.Infrastructure.Middleware;

// in the pipeline (order matters — before UseKormMigrations/MapControllers):
app.UseHttpsRedirection();
app.UseMiddleware<ApiExceptionMiddleware>();
app.UseKormMigrations();
app.MapControllers();
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `dotnet test BooksLibrary.slnx --filter "FullyQualifiedName~ApiExceptionMiddlewareTests"`
Expected: 5 passed.

- [ ] **Step 6: Run the full backend test suite**

Run: `dotnet test BooksLibrary.slnx`
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/BooksLibrary.Api/Infrastructure/Middleware/ApiExceptionMiddleware.cs src/BooksLibrary.Api/Program.cs tests/BooksLibrary.Api.Tests/ApiExceptionMiddlewareTests.cs
git commit -m "feat: map handler exceptions to HTTP statuses via ApiExceptionMiddleware"
```

---

### Task 2: Backend — CategoryId on BookListItem

**Files:**
- Modify: `src/BooksLibrary.Api/Application/Queries/Books/GetAllBooksQuery.cs`
- Test: `tests/BooksLibrary.Api.Tests/BooksQueryHandlerTests.cs`

- [ ] **Step 1: Write the failing test**

```csharp
using BooksLibrary.Api.Application.Queries.Books;
using BooksLibrary.Api.Domain;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace BooksLibrary.Api.Tests;

public class BooksQueryHandlerTests
{
    [Fact]
    public async Task Handle_GetAllBooks_MapsCategoryId()
    {
        var repository = Substitute.For<IBookRepository>();
        repository.GetAllAsync().Returns(new[]
        {
            new Book
            {
                Id = 1,
                Title = "Clean Code",
                Author = "Robert C. Martin",
                ISBN = "9780132350884",
                Year = 2008,
                CategoryId = 3,
                IsAvailable = true,
            },
        });
        var handler = new BooksQueryHandler(repository);

        var result = await handler.Handle(new GetAllBooksQuery(), CancellationToken.None);

        var item = result.Single();
        item.CategoryId.Should().Be(3);
        item.Title.Should().Be("Clean Code");
    }
}
```

Note: if `IBookRepository.GetAllAsync()` has a different return type than `Task<IEnumerable<Book>>`, adjust the `Returns(...)` value to match the actual signature in `src/BooksLibrary.Api/Domain/IBookRepository.cs`.

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test BooksLibrary.slnx --filter "FullyQualifiedName~BooksQueryHandlerTests"`
Expected: build FAILURE — `BookListItem` has no `CategoryId`.

- [ ] **Step 3: Add the property**

In `GetAllBooksQuery.cs`, add to the `BookListItem` class after `Year`:

```csharp
public long CategoryId { get; set; }
```

Mapster maps it automatically (same property name on `Book`); no handler change needed.

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test BooksLibrary.slnx --filter "FullyQualifiedName~BooksQueryHandlerTests"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/BooksLibrary.Api/Application/Queries/Books/GetAllBooksQuery.cs tests/BooksLibrary.Api.Tests/BooksQueryHandlerTests.cs
git commit -m "feat: expose CategoryId in book list query"
```

---

### Task 3: Scaffold the Angular workspace

**Files:**
- Create: `src/BooksLibrary.WebApp/` (CLI-generated workspace)
- Create: `src/BooksLibrary.WebApp/proxy.conf.json`
- Create: `src/BooksLibrary.WebApp/src/environments/environment.ts`
- Modify: `src/BooksLibrary.WebApp/angular.json` (PrimeNG styles)
- Modify: `src/BooksLibrary.WebApp/package.json` (start script)

- [ ] **Step 1: Generate the app (repo root)**

```bash
npx -p @angular/cli@15 ng new books-library-webapp --directory src/BooksLibrary.WebApp --routing --style scss --skip-git
```

Answer "No" to any analytics prompt. This pins the workspace to Angular 15.2.x.

- [ ] **Step 2: Install the stack (from src/BooksLibrary.WebApp)**

```bash
npm install primeng@15 primeicons@6 primeflex@3 @ngrx/store@15 @ngrx/effects@15 @ngrx/entity@15 @ngrx/router-store@15 @ngrx/store-devtools@15 ngrx-forms@8
```

If npm reports a peer-dependency conflict (ngrx-forms is the likely culprit), retry the same command with `--legacy-peer-deps`.

- [ ] **Step 3: Add PrimeNG styles to angular.json**

In `angular.json` under `projects.books-library-webapp.architect.build.options.styles`, replace the array with:

```json
"styles": [
  "node_modules/primeng/resources/themes/lara-light-blue/theme.css",
  "node_modules/primeng/resources/primeng.min.css",
  "node_modules/primeicons/primeicons.css",
  "node_modules/primeflex/primeflex.css",
  "src/styles.scss"
]
```

- [ ] **Step 4: Create proxy config**

`src/BooksLibrary.WebApp/proxy.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:5087",
    "secure": false
  }
}
```

- [ ] **Step 5: Wire the start script**

In `src/BooksLibrary.WebApp/package.json`, change the `start` script to:

```json
"start": "ng serve --proxy-config proxy.conf.json"
```

- [ ] **Step 6: Create the environment file**

Angular 15 no longer generates environments by default. Create `src/BooksLibrary.WebApp/src/environments/environment.ts`:

```ts
export const environment = {
  apiUrl: '/api',
};
```

- [ ] **Step 7: Verify the scaffold builds and tests run**

```bash
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

Expected: build succeeds; the 3 CLI-generated `app.component.spec.ts` tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/BooksLibrary.WebApp
git commit -m "chore: scaffold Angular 15 workspace with PrimeNG + NgRx + ngrx-forms"
```

---

### Task 4: Core models and API services

**Files:**
- Create: `src/BooksLibrary.WebApp/src/app/core/models/book.ts`
- Create: `src/BooksLibrary.WebApp/src/app/core/models/category.ts`
- Create: `src/BooksLibrary.WebApp/src/app/core/models/member.ts`
- Create: `src/BooksLibrary.WebApp/src/app/core/models/loan.ts`
- Create: `src/BooksLibrary.WebApp/src/app/core/services/books-api.service.ts`
- Create: `src/BooksLibrary.WebApp/src/app/core/services/categories-api.service.ts`
- Create: `src/BooksLibrary.WebApp/src/app/core/services/members-api.service.ts`
- Create: `src/BooksLibrary.WebApp/src/app/core/services/loans-api.service.ts`
- Test: `src/BooksLibrary.WebApp/src/app/core/services/books-api.service.spec.ts`
- Test: `src/BooksLibrary.WebApp/src/app/core/services/loans-api.service.spec.ts`

All frontend paths below are relative to `src/BooksLibrary.WebApp/`.

- [ ] **Step 1: Create the model interfaces**

`src/app/core/models/book.ts`:

```ts
export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  year: number;
  categoryId: number;
  isAvailable: boolean;
}

export interface SaveBookRequest {
  title: string;
  author: string;
  isbn: string;
  year: number;
  categoryId: number;
}
```

`src/app/core/models/category.ts`:

```ts
export interface Category {
  id: number;
  name: string;
}
```

`src/app/core/models/member.ts`:

```ts
export interface Member {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}
```

`src/app/core/models/loan.ts`:

```ts
import { Book } from './book';

export interface LoanDetail {
  id: number;
  bookId: number;
  memberId: number;
  loanDate: string;
  dueDate: string;
  isReturned: boolean;
  isOverdue: boolean;
  book: Book | null;
}

export interface CreateLoanRequest {
  bookId: number;
  memberId: number;
}
```

- [ ] **Step 2: Write the failing service tests**

`src/app/core/services/books-api.service.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BooksApiService } from './books-api.service';
import { Book } from '../models/book';

describe('BooksApiService', () => {
  let service: BooksApiService;
  let httpMock: HttpTestingController;

  const book: Book = {
    id: 1, title: 'Clean Code', author: 'Robert C. Martin',
    isbn: '9780132350884', year: 2008, categoryId: 3, isAvailable: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(BooksApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll issues GET /api/Books', () => {
    service.getAll().subscribe(result => expect(result).toEqual([book]));
    const req = httpMock.expectOne('/api/Books');
    expect(req.request.method).toBe('GET');
    req.flush([book]);
  });

  it('create issues POST /api/Books with the payload', () => {
    const payload = { title: 'T', author: 'A', isbn: 'I', year: 2000, categoryId: 1 };
    service.create(payload).subscribe(id => expect(id).toBe(10));
    const req = httpMock.expectOne('/api/Books');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(10);
  });

  it('update issues PUT /api/Books/:id', () => {
    service.update(5, { title: 'T', author: 'A', isbn: 'I', year: 2000, categoryId: 1 }).subscribe();
    const req = httpMock.expectOne('/api/Books/5');
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });

  it('delete issues DELETE /api/Books/:id', () => {
    service.delete(5).subscribe();
    const req = httpMock.expectOne('/api/Books/5');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
```

`src/app/core/services/loans-api.service.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LoansApiService } from './loans-api.service';

describe('LoansApiService', () => {
  let service: LoansApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(LoansApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getDetailAll issues GET /api/LoansDetail', () => {
    service.getDetailAll().subscribe();
    const req = httpMock.expectOne('/api/LoansDetail');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('create issues POST /api/Loans', () => {
    service.create({ bookId: 1, memberId: 2 }).subscribe(id => expect(id).toBe(7));
    const req = httpMock.expectOne('/api/Loans');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ bookId: 1, memberId: 2 });
    req.flush(7);
  });

  it('returnBook issues PUT /api/Loans/:id/return', () => {
    service.returnBook(7).subscribe();
    const req = httpMock.expectOne('/api/Loans/7/return');
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- --watch=false --browsers=ChromeHeadless`
Expected: FAIL — services do not exist (compile errors).

- [ ] **Step 4: Implement the services**

`src/app/core/services/books-api.service.ts`:

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Book, SaveBookRequest } from '../models/book';

@Injectable({ providedIn: 'root' })
export class BooksApiService {
  private readonly url = `${environment.apiUrl}/Books`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Book[]> {
    return this.http.get<Book[]>(this.url);
  }

  create(book: SaveBookRequest): Observable<number> {
    return this.http.post<number>(this.url, book);
  }

  update(id: number, book: SaveBookRequest): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}`, book);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
```

`src/app/core/services/categories-api.service.ts`:

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category } from '../models/category';

@Injectable({ providedIn: 'root' })
export class CategoriesApiService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(`${environment.apiUrl}/Categories`);
  }
}
```

`src/app/core/services/members-api.service.ts`:

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Member } from '../models/member';

@Injectable({ providedIn: 'root' })
export class MembersApiService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Member[]> {
    return this.http.get<Member[]>(`${environment.apiUrl}/Members`);
  }
}
```

`src/app/core/services/loans-api.service.ts`:

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateLoanRequest, LoanDetail } from '../models/loan';

@Injectable({ providedIn: 'root' })
export class LoansApiService {
  private readonly url = `${environment.apiUrl}/Loans`;

  constructor(private http: HttpClient) {}

  getDetailAll(): Observable<LoanDetail[]> {
    return this.http.get<LoanDetail[]>(`${environment.apiUrl}/LoansDetail`);
  }

  create(request: CreateLoanRequest): Observable<number> {
    return this.http.post<number>(this.url, request);
  }

  returnBook(id: number): Observable<void> {
    return this.http.put<void>(`${this.url}/${id}/return`, null);
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- --watch=false --browsers=ChromeHeadless`
Expected: all service tests PASS (plus CLI-generated app tests).

- [ ] **Step 6: Commit**

```bash
git add src/BooksLibrary.WebApp/src/app/core
git commit -m "feat: add core models and typed API services"
```

---

### Task 5: ApiErrorInterceptor

**Files:**
- Create: `src/app/core/interceptors/api-error.interceptor.ts`
- Test: `src/app/core/interceptors/api-error.interceptor.spec.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { ApiErrorInterceptor } from './api-error.interceptor';

describe('ApiErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let messageService: jasmine.SpyObj<MessageService>;

  beforeEach(() => {
    messageService = jasmine.createSpyObj('MessageService', ['add']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: MessageService, useValue: messageService },
        { provide: HTTP_INTERCEPTORS, useClass: ApiErrorInterceptor, multi: true },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('shows the backend detail for 409 responses', () => {
    http.get('/api/Loans').subscribe({ error: () => {} });
    httpMock.expectOne('/api/Loans').flush(
      { status: 409, title: 'Business rule violation', detail: 'Member has reached the maximum of 5 active loans.' },
      { status: 409, statusText: 'Conflict' },
    );

    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      severity: 'error',
      detail: 'Member has reached the maximum of 5 active loans.',
    }));
  });

  it('shows the backend detail for 400 responses', () => {
    http.post('/api/Books', {}).subscribe({ error: () => {} });
    httpMock.expectOne('/api/Books').flush(
      { status: 400, title: 'Validation failed', detail: 'Title must not be empty.' },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      severity: 'error',
      detail: 'Title must not be empty.',
    }));
  });

  it('shows a generic message for 500 responses', () => {
    http.get('/api/Books').subscribe({ error: () => {} });
    httpMock.expectOne('/api/Books').flush('boom', { status: 500, statusText: 'Server Error' });

    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
      severity: 'error',
      detail: 'Something went wrong',
    }));
  });

  it('re-throws the error so effects still see the failure', () => {
    let caught = false;
    http.get('/api/Books').subscribe({ error: () => (caught = true) });
    httpMock.expectOne('/api/Books').flush('boom', { status: 500, statusText: 'Server Error' });
    expect(caught).toBeTrue();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --watch=false --browsers=ChromeHeadless`
Expected: FAIL — interceptor does not exist.

- [ ] **Step 3: Implement the interceptor**

```ts
import {
  HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable()
export class ApiErrorInterceptor implements HttpInterceptor {
  constructor(private messageService: MessageService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.toMessage(error),
        });
        return throwError(() => error);
      }),
    );
  }

  private toMessage(error: HttpErrorResponse): string {
    if ([400, 404, 409].includes(error.status)) {
      return error.error?.detail ?? error.error?.title ?? 'Request failed';
    }
    return 'Something went wrong';
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --watch=false --browsers=ChromeHeadless`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/BooksLibrary.WebApp/src/app/core/interceptors
git commit -m "feat: add ApiErrorInterceptor mapping API errors to toasts"
```

---

### Task 6: SharedModule and app shell

**Files:**
- Create: `src/app/shared/shared.module.ts`
- Modify: `src/app/app.module.ts`
- Modify: `src/app/app-routing.module.ts`
- Modify: `src/app/app.component.ts`
- Modify: `src/app/app.component.html` (replace generated placeholder entirely)
- Modify: `src/app/app.component.spec.ts` (replace generated tests)

- [ ] **Step 1: Create SharedModule**

`src/app/shared/shared.module.ts`:

```ts
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgrxFormsModule } from 'ngrx-forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';

const MODULES = [
  CommonModule,
  FormsModule,
  NgrxFormsModule,
  ButtonModule,
  CheckboxModule,
  ConfirmDialogModule,
  DialogModule,
  DropdownModule,
  InputTextModule,
  TableModule,
  TagModule,
  ToolbarModule,
];

@NgModule({
  imports: MODULES,
  exports: MODULES,
})
export class SharedModule {}
```

- [ ] **Step 2: Set up routing**

`src/app/app-routing.module.ts` (replace contents):

```ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: 'books', loadChildren: () => import('./books/books.module').then(m => m.BooksModule) },
  { path: 'loans', loadChildren: () => import('./loans/loans.module').then(m => m.LoansModule) },
  { path: '', pathMatch: 'full', redirectTo: 'books' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
```

Note: the lazy routes reference `books/books.module` and `loans/loans.module`, created in Tasks 8 and 10. Until those tasks, `npm run build` fails on the missing imports — that's expected mid-plan. To keep the app buildable at the end of THIS task, create both module files now as empty placeholders:

`src/app/books/books.module.ts`:

```ts
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [RouterModule.forChild([])],
})
export class BooksModule {}
```

`src/app/loans/loans.module.ts`:

```ts
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [RouterModule.forChild([])],
})
export class LoansModule {}
```

(Tasks 8 and 10 replace these with the real modules.)

- [ ] **Step 3: Root AppModule**

`src/app/app.module.ts` (replace contents):

```ts
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EffectsModule } from '@ngrx/effects';
import { routerReducer, StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { MessageService } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { ToastModule } from 'primeng/toast';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ApiErrorInterceptor } from './core/interceptors/api-error.interceptor';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    StoreModule.forRoot({ router: routerReducer }),
    EffectsModule.forRoot([]),
    StoreRouterConnectingModule.forRoot(),
    StoreDevtoolsModule.instrument({ maxAge: 25 }),
    MenubarModule,
    ToastModule,
  ],
  providers: [
    MessageService,
    { provide: HTTP_INTERCEPTORS, useClass: ApiErrorInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

- [ ] **Step 4: App component**

`src/app/app.component.ts` (replace contents):

```ts
import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  menuItems: MenuItem[] = [
    { label: 'Books', icon: 'pi pi-book', routerLink: '/books' },
    { label: 'Loans', icon: 'pi pi-sync', routerLink: '/loans' },
  ];
}
```

`src/app/app.component.html` (replace ALL generated content):

```html
<p-toast></p-toast>
<p-menubar [model]="menuItems">
  <ng-template pTemplate="start">
    <span class="text-xl font-bold mr-3">📚 BooksLibrary</span>
  </ng-template>
</p-menubar>
<div class="p-3">
  <router-outlet></router-outlet>
</div>
```

- [ ] **Step 5: Replace the generated app.component.spec.ts**

```ts
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { ToastModule } from 'primeng/toast';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, NoopAnimationsModule, MenubarModule, ToastModule],
      declarations: [AppComponent],
      providers: [MessageService],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('has Books and Loans menu items', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const labels = fixture.componentInstance.menuItems.map(i => i.label);
    expect(labels).toEqual(['Books', 'Loans']);
  });
});
```

- [ ] **Step 6: Verify build and tests**

```bash
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

Expected: both succeed.

- [ ] **Step 7: Commit**

```bash
git add src/BooksLibrary.WebApp/src/app
git commit -m "feat: add app shell with menubar, routing, root store, and shared module"
```

---

### Task 7: Books store (form, actions, reducer, selectors, effects)

**Files:**
- Create: `src/app/books/store/book-form.ts`
- Create: `src/app/books/store/books.actions.ts`
- Create: `src/app/books/store/books.reducer.ts`
- Create: `src/app/books/store/books.selectors.ts`
- Create: `src/app/books/store/books.effects.ts`
- Test: `src/app/books/store/books.reducer.spec.ts`
- Test: `src/app/books/store/books.selectors.spec.ts`
- Test: `src/app/books/store/books.effects.spec.ts`

- [ ] **Step 1: Create form definition and actions (no tests — pure declarations)**

`src/app/books/store/book-form.ts`:

```ts
import { createFormGroupState, FormGroupState } from 'ngrx-forms';

export interface BookFormValue {
  title: string;
  author: string;
  isbn: string;
  year: number;
  categoryId: number | null;
}

export const BOOK_FORM_ID = 'books.bookForm';

export const emptyBookFormValue: BookFormValue = {
  title: '',
  author: '',
  isbn: '',
  year: new Date().getFullYear(),
  categoryId: null,
};

export function createBookFormState(value: BookFormValue): FormGroupState<BookFormValue> {
  return createFormGroupState(BOOK_FORM_ID, value);
}
```

`src/app/books/store/books.actions.ts`:

```ts
import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Book } from '../../core/models/book';
import { Category } from '../../core/models/category';

export const BooksPageActions = createActionGroup({
  source: 'Books Page',
  events: {
    'Opened': emptyProps(),
    'Open Create Dialog': emptyProps(),
    'Open Edit Dialog': props<{ book: Book }>(),
    'Close Dialog': emptyProps(),
    'Save': emptyProps(),
    'Delete': props<{ id: number }>(),
  },
});

export const BooksApiActions = createActionGroup({
  source: 'Books API',
  events: {
    'Load Success': props<{ books: Book[] }>(),
    'Load Failure': emptyProps(),
    'Load Categories Success': props<{ categories: Category[] }>(),
    'Save Success': emptyProps(),
    'Save Failure': emptyProps(),
    'Delete Success': emptyProps(),
    'Delete Failure': emptyProps(),
  },
});
```

- [ ] **Step 2: Write the failing reducer tests**

`src/app/books/store/books.reducer.spec.ts`:

```ts
import { Book } from '../../core/models/book';
import { BooksApiActions, BooksPageActions } from './books.actions';
import { booksReducer, initialBooksState } from './books.reducer';

describe('booksReducer', () => {
  const book: Book = {
    id: 1, title: 'Clean Code', author: 'Robert C. Martin',
    isbn: '9780132350884', year: 2008, categoryId: 3, isAvailable: true,
  };

  it('stores books and sets loaded on loadSuccess', () => {
    const state = booksReducer(initialBooksState, BooksApiActions.loadSuccess({ books: [book] }));
    expect(state.loaded).toBeTrue();
    expect(state.books.ids).toEqual([1]);
    expect(state.books.entities[1]).toEqual(book);
  });

  it('stores categories on loadCategoriesSuccess', () => {
    const state = booksReducer(
      initialBooksState,
      BooksApiActions.loadCategoriesSuccess({ categories: [{ id: 3, name: 'Programming' }] }),
    );
    expect(state.categories).toEqual([{ id: 3, name: 'Programming' }]);
  });

  it('openCreateDialog opens the dialog with an empty, invalid form', () => {
    const state = booksReducer(initialBooksState, BooksPageActions.openCreateDialog());
    expect(state.dialog).toEqual({ open: true, editedId: null });
    expect(state.bookForm.value.title).toBe('');
    expect(state.bookForm.controls.title.isInvalid).toBeTrue();
  });

  it('openEditDialog fills the form from the book', () => {
    const state = booksReducer(initialBooksState, BooksPageActions.openEditDialog({ book }));
    expect(state.dialog).toEqual({ open: true, editedId: 1 });
    expect(state.bookForm.value).toEqual({
      title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884',
      year: 2008, categoryId: 3,
    });
    expect(state.bookForm.isValid).toBeTrue();
  });

  it('closeDialog closes the dialog', () => {
    const opened = booksReducer(initialBooksState, BooksPageActions.openCreateDialog());
    const state = booksReducer(opened, BooksPageActions.closeDialog());
    expect(state.dialog.open).toBeFalse();
  });

  it('save sets saving; saveSuccess clears saving and closes the dialog', () => {
    const opened = booksReducer(initialBooksState, BooksPageActions.openCreateDialog());
    const savingState = booksReducer(opened, BooksPageActions.save());
    expect(savingState.saving).toBeTrue();

    const done = booksReducer(savingState, BooksApiActions.saveSuccess());
    expect(done.saving).toBeFalse();
    expect(done.dialog.open).toBeFalse();
  });

  it('saveFailure clears saving but keeps the dialog open', () => {
    const opened = booksReducer(initialBooksState, BooksPageActions.openCreateDialog());
    const savingState = booksReducer(opened, BooksPageActions.save());
    const state = booksReducer(savingState, BooksApiActions.saveFailure());
    expect(state.saving).toBeFalse();
    expect(state.dialog.open).toBeTrue();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- --watch=false --browsers=ChromeHeadless`
Expected: FAIL — reducer does not exist.

- [ ] **Step 4: Implement the reducer**

`src/app/books/store/books.reducer.ts`:

```ts
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import {
  FormGroupState, onNgrxForms, updateGroup, validate, wrapReducerWithFormStateUpdate,
} from 'ngrx-forms';
import { greaterThan, lessThanOrEqualTo, maxLength, required } from 'ngrx-forms/validation';
import { Book } from '../../core/models/book';
import { Category } from '../../core/models/category';
import { BookFormValue, createBookFormState, emptyBookFormValue } from './book-form';
import { BooksApiActions, BooksPageActions } from './books.actions';

export const booksFeatureKey = 'books';

export const booksAdapter = createEntityAdapter<Book>();

export interface BooksState {
  books: EntityState<Book>;
  loaded: boolean;
  saving: boolean;
  dialog: { open: boolean; editedId: number | null };
  bookForm: FormGroupState<BookFormValue>;
  categories: Category[];
}

export const initialBooksState: BooksState = {
  books: booksAdapter.getInitialState(),
  loaded: false,
  saving: false,
  dialog: { open: false, editedId: null },
  bookForm: createBookFormState(emptyBookFormValue),
  categories: [],
};

const rawReducer = createReducer(
  initialBooksState,
  onNgrxForms(),
  on(BooksApiActions.loadSuccess, (state, { books }) => ({
    ...state,
    books: booksAdapter.setAll(books, state.books),
    loaded: true,
  })),
  on(BooksApiActions.loadCategoriesSuccess, (state, { categories }) => ({ ...state, categories })),
  on(BooksPageActions.openCreateDialog, state => ({
    ...state,
    dialog: { open: true, editedId: null },
    bookForm: createBookFormState(emptyBookFormValue),
  })),
  on(BooksPageActions.openEditDialog, (state, { book }) => ({
    ...state,
    dialog: { open: true, editedId: book.id },
    bookForm: createBookFormState({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      year: book.year,
      categoryId: book.categoryId,
    }),
  })),
  on(BooksPageActions.closeDialog, state => ({
    ...state,
    dialog: { open: false, editedId: null },
  })),
  on(BooksPageActions.save, state => ({ ...state, saving: true })),
  on(BooksApiActions.saveSuccess, state => ({
    ...state,
    saving: false,
    dialog: { open: false, editedId: null },
  })),
  on(BooksApiActions.saveFailure, state => ({ ...state, saving: false })),
);

export const validateBookForm = updateGroup<BookFormValue>({
  title: validate(required, maxLength(200)),
  author: validate(required, maxLength(100)),
  isbn: validate(required, maxLength(13)),
  year: validate(required, greaterThan(0), lessThanOrEqualTo(new Date().getFullYear())),
  categoryId: validate(required),
});

export const booksReducer = wrapReducerWithFormStateUpdate(
  rawReducer,
  state => state.bookForm,
  validateBookForm,
);
```

Note: `validateBookForm` is exported so effects tests can build a validated form state.

- [ ] **Step 5: Run reducer tests to verify they pass**

Run: `npm test -- --watch=false --browsers=ChromeHeadless`
Expected: PASS.

- [ ] **Step 6: Write the failing selector tests**

`src/app/books/store/books.selectors.spec.ts`:

```ts
import { Book } from '../../core/models/book';
import { booksAdapter, initialBooksState } from './books.reducer';
import { selectBooksVm } from './books.selectors';

describe('books selectors', () => {
  const book: Book = {
    id: 1, title: 'Clean Code', author: 'Robert C. Martin',
    isbn: '9780132350884', year: 2008, categoryId: 3, isAvailable: true,
  };

  it('selectBooksVm joins the category name', () => {
    const state = {
      ...initialBooksState,
      books: booksAdapter.setAll([book], initialBooksState.books),
      categories: [{ id: 3, name: 'Programming' }],
    };

    const vm = selectBooksVm.projector(
      booksAdapter.getSelectors().selectAll(state.books),
      state.categories,
    );

    expect(vm).toEqual([{ ...book, categoryName: 'Programming' }]);
  });

  it('selectBooksVm falls back to empty name for unknown category', () => {
    const vm = selectBooksVm.projector([book], []);
    expect(vm[0].categoryName).toBe('');
  });
});
```

- [ ] **Step 7: Run tests to verify they fail, then implement selectors**

Run: `npm test -- --watch=false --browsers=ChromeHeadless` — expected FAIL (selectors missing).

`src/app/books/store/books.selectors.ts`:

```ts
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { Book } from '../../core/models/book';
import { booksAdapter, booksFeatureKey, BooksState } from './books.reducer';

export const selectBooksState = createFeatureSelector<BooksState>(booksFeatureKey);

const entitySelectors = booksAdapter.getSelectors();

export const selectAllBooks = createSelector(selectBooksState, s => entitySelectors.selectAll(s.books));
export const selectBooksLoaded = createSelector(selectBooksState, s => s.loaded);
export const selectCategories = createSelector(selectBooksState, s => s.categories);
export const selectDialogOpen = createSelector(selectBooksState, s => s.dialog.open);
export const selectEditedId = createSelector(selectBooksState, s => s.dialog.editedId);
export const selectBookForm = createSelector(selectBooksState, s => s.bookForm);
export const selectSaving = createSelector(selectBooksState, s => s.saving);

export interface BookVm extends Book {
  categoryName: string;
}

export const selectBooksVm = createSelector(
  selectAllBooks,
  selectCategories,
  (books, categories): BookVm[] =>
    books.map(b => ({
      ...b,
      categoryName: categories.find(c => c.id === b.categoryId)?.name ?? '',
    })),
);
```

Run: `npm test -- --watch=false --browsers=ChromeHeadless` — expected PASS.

- [ ] **Step 8: Write the failing effects tests**

`src/app/books/store/books.effects.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MessageService } from 'primeng/api';
import { Observable, of, throwError } from 'rxjs';
import { Book } from '../../core/models/book';
import { BooksApiService } from '../../core/services/books-api.service';
import { CategoriesApiService } from '../../core/services/categories-api.service';
import { createBookFormState } from './book-form';
import { BooksApiActions, BooksPageActions } from './books.actions';
import { validateBookForm } from './books.reducer';
import { BooksEffects } from './books.effects';
import {
  selectBookForm, selectBooksLoaded, selectCategories, selectEditedId,
} from './books.selectors';

describe('BooksEffects', () => {
  let actions$: Observable<Action>;
  let effects: BooksEffects;
  let booksApi: jasmine.SpyObj<BooksApiService>;
  let store: MockStore;

  const book: Book = {
    id: 1, title: 'Clean Code', author: 'Robert C. Martin',
    isbn: '9780132350884', year: 2008, categoryId: 3, isAvailable: true,
  };

  const validForm = validateBookForm(createBookFormState({
    title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884',
    year: 2008, categoryId: 3,
  }));

  beforeEach(() => {
    booksApi = jasmine.createSpyObj('BooksApiService', ['getAll', 'create', 'update', 'delete']);
    const categoriesApi = jasmine.createSpyObj('CategoriesApiService', ['getAll']);
    categoriesApi.getAll.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        BooksEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          selectors: [
            { selector: selectBooksLoaded, value: false },
            { selector: selectCategories, value: [] },
            { selector: selectBookForm, value: validForm },
            { selector: selectEditedId, value: null },
          ],
        }),
        { provide: BooksApiService, useValue: booksApi },
        { provide: CategoriesApiService, useValue: categoriesApi },
        { provide: MessageService, useValue: jasmine.createSpyObj('MessageService', ['add']) },
      ],
    });

    effects = TestBed.inject(BooksEffects);
    store = TestBed.inject(MockStore);
  });

  it('load$ fetches books when not loaded', (done) => {
    booksApi.getAll.and.returnValue(of([book]));
    actions$ = of(BooksPageActions.opened());

    effects.load$.subscribe(action => {
      expect(action).toEqual(BooksApiActions.loadSuccess({ books: [book] }));
      done();
    });
  });

  it('load$ does nothing when already loaded', () => {
    store.overrideSelector(selectBooksLoaded, true);
    store.refreshState();
    actions$ = of(BooksPageActions.opened());

    let emitted = false;
    effects.load$.subscribe(() => (emitted = true));
    expect(emitted).toBeFalse();
  });

  it('save$ creates a new book when editedId is null', (done) => {
    booksApi.create.and.returnValue(of(10));
    actions$ = of(BooksPageActions.save());

    effects.save$.subscribe(action => {
      expect(booksApi.create).toHaveBeenCalledWith({
        title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884',
        year: 2008, categoryId: 3,
      });
      expect(action).toEqual(BooksApiActions.saveSuccess());
      done();
    });
  });

  it('save$ updates when editedId is set', (done) => {
    store.overrideSelector(selectEditedId, 1);
    store.refreshState();
    booksApi.update.and.returnValue(of(void 0));
    actions$ = of(BooksPageActions.save());

    effects.save$.subscribe(action => {
      expect(booksApi.update).toHaveBeenCalledWith(1, jasmine.objectContaining({ title: 'Clean Code' }));
      expect(action).toEqual(BooksApiActions.saveSuccess());
      done();
    });
  });

  it('save$ maps API errors to saveFailure', (done) => {
    booksApi.create.and.returnValue(throwError(() => new Error('409')));
    actions$ = of(BooksPageActions.save());

    effects.save$.subscribe(action => {
      expect(action).toEqual(BooksApiActions.saveFailure());
      done();
    });
  });

  it('delete$ maps success to deleteSuccess', (done) => {
    booksApi.delete.and.returnValue(of(void 0));
    actions$ = of(BooksPageActions.delete({ id: 1 }));

    effects.delete$.subscribe(action => {
      expect(booksApi.delete).toHaveBeenCalledWith(1);
      expect(action).toEqual(BooksApiActions.deleteSuccess());
      done();
    });
  });

  it('refresh$ refetches after saveSuccess', (done) => {
    booksApi.getAll.and.returnValue(of([book]));
    actions$ = of(BooksApiActions.saveSuccess());

    effects.refresh$.subscribe(action => {
      expect(action).toEqual(BooksApiActions.loadSuccess({ books: [book] }));
      done();
    });
  });
});
```

- [ ] **Step 9: Run tests to verify they fail, then implement effects**

Run: `npm test -- --watch=false --browsers=ChromeHeadless` — expected FAIL (effects missing).

`src/app/books/store/books.effects.ts`:

```ts
import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { MarkAsSubmittedAction } from 'ngrx-forms';
import { MessageService } from 'primeng/api';
import { EMPTY, catchError, exhaustMap, filter, from, map, of, switchMap, tap } from 'rxjs';
import { SaveBookRequest } from '../../core/models/book';
import { BooksApiService } from '../../core/services/books-api.service';
import { CategoriesApiService } from '../../core/services/categories-api.service';
import { BOOK_FORM_ID } from './book-form';
import { BooksApiActions, BooksPageActions } from './books.actions';
import {
  selectBookForm, selectBooksLoaded, selectCategories, selectEditedId,
} from './books.selectors';

@Injectable()
export class BooksEffects {
  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BooksPageActions.opened),
      concatLatestFrom(() => this.store.select(selectBooksLoaded)),
      filter(([, loaded]) => !loaded),
      switchMap(() =>
        this.booksApi.getAll().pipe(
          map(books => BooksApiActions.loadSuccess({ books })),
          catchError(() => of(BooksApiActions.loadFailure())),
        ),
      ),
    ),
  );

  refresh$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BooksApiActions.saveSuccess, BooksApiActions.deleteSuccess),
      switchMap(() =>
        this.booksApi.getAll().pipe(
          map(books => BooksApiActions.loadSuccess({ books })),
          catchError(() => of(BooksApiActions.loadFailure())),
        ),
      ),
    ),
  );

  loadCategories$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BooksPageActions.opened),
      concatLatestFrom(() => this.store.select(selectCategories)),
      filter(([, categories]) => categories.length === 0),
      switchMap(() =>
        this.categoriesApi.getAll().pipe(
          map(categories => BooksApiActions.loadCategoriesSuccess({ categories })),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );

  save$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BooksPageActions.save),
      concatLatestFrom(() => [
        this.store.select(selectBookForm),
        this.store.select(selectEditedId),
      ]),
      exhaustMap(([, form, editedId]) => {
        if (form.isInvalid) {
          return from<Action>([
            new MarkAsSubmittedAction(BOOK_FORM_ID),
            BooksApiActions.saveFailure(),
          ]);
        }
        const payload: SaveBookRequest = {
          title: form.value.title,
          author: form.value.author,
          isbn: form.value.isbn,
          year: form.value.year,
          categoryId: form.value.categoryId!,
        };
        const request$ = editedId === null
          ? this.booksApi.create(payload)
          : this.booksApi.update(editedId, payload);
        return request$.pipe(
          map(() => BooksApiActions.saveSuccess()),
          catchError(() => of(BooksApiActions.saveFailure())),
        );
      }),
    ),
  );

  delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BooksPageActions.delete),
      exhaustMap(({ id }) =>
        this.booksApi.delete(id).pipe(
          map(() => BooksApiActions.deleteSuccess()),
          catchError(() => of(BooksApiActions.deleteFailure())),
        ),
      ),
    ),
  );

  saveSuccessToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BooksApiActions.saveSuccess),
        tap(() => this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Book saved.' })),
      ),
    { dispatch: false },
  );

  deleteSuccessToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(BooksApiActions.deleteSuccess),
        tap(() => this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Book deleted.' })),
      ),
    { dispatch: false },
  );

  constructor(
    private actions$: Actions,
    private store: Store,
    private booksApi: BooksApiService,
    private categoriesApi: CategoriesApiService,
    private messageService: MessageService,
  ) {}
}
```

- [ ] **Step 10: Run tests to verify they pass**

Run: `npm test -- --watch=false --browsers=ChromeHeadless`
Expected: all PASS.

- [ ] **Step 11: Commit**

```bash
git add src/BooksLibrary.WebApp/src/app/books/store
git commit -m "feat: add books NgRx feature slice with ngrx-forms dialog form"
```

---

### Task 8: Books UI (module, page, dialog)

**Files:**
- Modify: `src/app/books/books.module.ts` (replace the Task 6 placeholder)
- Create: `src/app/books/books-page/books-page.component.ts`
- Create: `src/app/books/books-page/books-page.component.html`
- Create: `src/app/books/book-dialog/book-dialog.component.ts`
- Create: `src/app/books/book-dialog/book-dialog.component.html`
- Test: `src/app/books/books-page/books-page.component.spec.ts`

- [ ] **Step 1: Write the failing component test**

`src/app/books/books-page/books-page.component.spec.ts`:

```ts
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { BooksPageActions } from '../store/books.actions';
import { BookVm, selectBooksVm } from '../store/books.selectors';
import { BooksPageComponent } from './books-page.component';

describe('BooksPageComponent', () => {
  let fixture: ComponentFixture<BooksPageComponent>;
  let store: MockStore;

  const vm: BookVm[] = [{
    id: 1, title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884',
    year: 2008, categoryId: 3, isAvailable: true, categoryName: 'Programming',
  }];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BooksPageComponent],
      imports: [TableModule, NoopAnimationsModule],
      providers: [
        provideMockStore({ selectors: [{ selector: selectBooksVm, value: vm }] }),
        ConfirmationService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
    fixture = TestBed.createComponent(BooksPageComponent);
    fixture.detectChanges();
  });

  it('dispatches opened on init', () => {
    expect(store.dispatch).toHaveBeenCalledWith(BooksPageActions.opened());
  });

  it('renders book rows with the category name', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Clean Code');
    expect(text).toContain('Programming');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --watch=false --browsers=ChromeHeadless`
Expected: FAIL — component does not exist.

- [ ] **Step 3: Implement the page component**

`src/app/books/books-page/books-page.component.ts`:

```ts
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ConfirmationService } from 'primeng/api';
import { Book } from '../../core/models/book';
import { BooksPageActions } from '../store/books.actions';
import { selectBooksVm } from '../store/books.selectors';

@Component({
  selector: 'app-books-page',
  templateUrl: './books-page.component.html',
})
export class BooksPageComponent implements OnInit {
  vm$ = this.store.select(selectBooksVm);

  constructor(
    private store: Store,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.store.dispatch(BooksPageActions.opened());
  }

  onNew(): void {
    this.store.dispatch(BooksPageActions.openCreateDialog());
  }

  onEdit(book: Book): void {
    this.store.dispatch(BooksPageActions.openEditDialog({ book }));
  }

  onDelete(book: Book): void {
    this.confirmationService.confirm({
      message: `Delete "${book.title}"?`,
      header: 'Confirm delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.store.dispatch(BooksPageActions.delete({ id: book.id })),
    });
  }
}
```

`src/app/books/books-page/books-page.component.html`:

```html
<p-toolbar styleClass="mb-3">
  <ng-template pTemplate="left">
    <h2 class="m-0">Books</h2>
  </ng-template>
  <ng-template pTemplate="right">
    <button pButton label="New Book" icon="pi pi-plus" (click)="onNew()"></button>
  </ng-template>
</p-toolbar>

<p-table [value]="(vm$ | async) ?? []" styleClass="p-datatable-sm">
  <ng-template pTemplate="header">
    <tr>
      <th>Title</th>
      <th>Author</th>
      <th>Year</th>
      <th>Category</th>
      <th>Status</th>
      <th style="width: 8rem"></th>
    </tr>
  </ng-template>
  <ng-template pTemplate="body" let-book>
    <tr>
      <td>{{ book.title }}</td>
      <td>{{ book.author }}</td>
      <td>{{ book.year }}</td>
      <td>{{ book.categoryName }}</td>
      <td>
        <p-tag
          [value]="book.isAvailable ? 'Available' : 'On loan'"
          [severity]="book.isAvailable ? 'success' : 'warning'">
        </p-tag>
      </td>
      <td>
        <button pButton icon="pi pi-pencil" class="p-button-text mr-1" (click)="onEdit(book)"></button>
        <button pButton icon="pi pi-trash" class="p-button-text p-button-danger" (click)="onDelete(book)"></button>
      </td>
    </tr>
  </ng-template>
  <ng-template pTemplate="emptymessage">
    <tr><td colspan="6">No books found.</td></tr>
  </ng-template>
</p-table>

<app-book-dialog></app-book-dialog>
<p-confirmDialog [style]="{ width: '24rem' }"></p-confirmDialog>
```

- [ ] **Step 4: Implement the dialog component**

`src/app/books/book-dialog/book-dialog.component.ts`:

```ts
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { BooksPageActions } from '../store/books.actions';
import {
  selectBookForm, selectCategories, selectDialogOpen, selectEditedId, selectSaving,
} from '../store/books.selectors';

@Component({
  selector: 'app-book-dialog',
  templateUrl: './book-dialog.component.html',
})
export class BookDialogComponent {
  open$ = this.store.select(selectDialogOpen);
  form$ = this.store.select(selectBookForm);
  saving$ = this.store.select(selectSaving);
  editedId$ = this.store.select(selectEditedId);
  categories$ = this.store.select(selectCategories);

  constructor(private store: Store) {}

  onSave(): void {
    this.store.dispatch(BooksPageActions.save());
  }

  onClose(): void {
    this.store.dispatch(BooksPageActions.closeDialog());
  }
}
```

`src/app/books/book-dialog/book-dialog.component.html`:

```html
<p-dialog
  [visible]="(open$ | async) ?? false"
  (onHide)="onClose()"
  [modal]="true"
  [style]="{ width: '28rem' }"
  [header]="(editedId$ | async) === null ? 'New Book' : 'Edit Book'"
  [closable]="true">

  <div class="p-fluid" *ngIf="form$ | async as form">
    <div class="field">
      <label for="title">Title</label>
      <input pInputText id="title" [ngrxFormControlState]="form.controls.title" />
      <small class="p-error" *ngIf="form.controls.title.isInvalid && (form.controls.title.isTouched || form.isSubmitted)">
        Title is required (max 200 characters).
      </small>
    </div>

    <div class="field">
      <label for="author">Author</label>
      <input pInputText id="author" [ngrxFormControlState]="form.controls.author" />
      <small class="p-error" *ngIf="form.controls.author.isInvalid && (form.controls.author.isTouched || form.isSubmitted)">
        Author is required (max 100 characters).
      </small>
    </div>

    <div class="field">
      <label for="isbn">ISBN</label>
      <input pInputText id="isbn" [ngrxFormControlState]="form.controls.isbn" />
      <small class="p-error" *ngIf="form.controls.isbn.isInvalid && (form.controls.isbn.isTouched || form.isSubmitted)">
        ISBN is required (max 13 characters).
      </small>
    </div>

    <div class="field">
      <label for="year">Year</label>
      <input pInputText id="year" type="number" [ngrxFormControlState]="form.controls.year" />
      <small class="p-error" *ngIf="form.controls.year.isInvalid && (form.controls.year.isTouched || form.isSubmitted)">
        Year must be between 1 and the current year.
      </small>
    </div>

    <div class="field">
      <label for="category">Category</label>
      <p-dropdown
        inputId="category"
        [options]="(categories$ | async) ?? []"
        optionLabel="name"
        optionValue="id"
        placeholder="Select a category"
        [ngrxFormControlState]="form.controls.categoryId">
      </p-dropdown>
      <small class="p-error" *ngIf="form.controls.categoryId.isInvalid && (form.controls.categoryId.isTouched || form.isSubmitted)">
        Category is required.
      </small>
    </div>
  </div>

  <ng-template pTemplate="footer">
    <button pButton label="Cancel" class="p-button-text" (click)="onClose()"></button>
    <button pButton label="Save" [disabled]="(saving$ | async) ?? false" (click)="onSave()"></button>
  </ng-template>
</p-dialog>
```

- [ ] **Step 5: Replace the placeholder BooksModule**

`src/app/books/books.module.ts` (replace contents):

```ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { SharedModule } from '../shared/shared.module';
import { BookDialogComponent } from './book-dialog/book-dialog.component';
import { BooksPageComponent } from './books-page/books-page.component';
import { BooksEffects } from './store/books.effects';
import { booksFeatureKey, booksReducer } from './store/books.reducer';

const routes: Routes = [{ path: '', component: BooksPageComponent }];

@NgModule({
  declarations: [BooksPageComponent, BookDialogComponent],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    StoreModule.forFeature(booksFeatureKey, booksReducer),
    EffectsModule.forFeature([BooksEffects]),
  ],
})
export class BooksModule {}
```

- [ ] **Step 6: Run tests and build**

```bash
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

Expected: all tests PASS, build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/BooksLibrary.WebApp/src/app/books
git commit -m "feat: add books page and dialog with PrimeNG table and ngrx-forms"
```

---

### Task 9: Loans store

**Files:**
- Create: `src/app/loans/store/loan-form.ts`
- Create: `src/app/loans/store/loans.actions.ts`
- Create: `src/app/loans/store/loans.reducer.ts`
- Create: `src/app/loans/store/loans.selectors.ts`
- Create: `src/app/loans/store/loans.effects.ts`
- Test: `src/app/loans/store/loans.reducer.spec.ts`
- Test: `src/app/loans/store/loans.selectors.spec.ts`
- Test: `src/app/loans/store/loans.effects.spec.ts`

- [ ] **Step 1: Create form definition and actions**

`src/app/loans/store/loan-form.ts`:

```ts
import { createFormGroupState, FormGroupState } from 'ngrx-forms';

export interface LoanFormValue {
  bookId: number | null;
  memberId: number | null;
}

export const LOAN_FORM_ID = 'loans.loanForm';

export const emptyLoanFormValue: LoanFormValue = {
  bookId: null,
  memberId: null,
};

export function createLoanFormState(value: LoanFormValue): FormGroupState<LoanFormValue> {
  return createFormGroupState(LOAN_FORM_ID, value);
}
```

`src/app/loans/store/loans.actions.ts`:

```ts
import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Book } from '../../core/models/book';
import { LoanDetail } from '../../core/models/loan';
import { Member } from '../../core/models/member';

export const LoansPageActions = createActionGroup({
  source: 'Loans Page',
  events: {
    'Opened': emptyProps(),
    'Toggle Show Returned': props<{ showReturned: boolean }>(),
    'Open Dialog': emptyProps(),
    'Close Dialog': emptyProps(),
    'Save': emptyProps(),
    'Return Book': props<{ id: number }>(),
  },
});

export const LoansApiActions = createActionGroup({
  source: 'Loans API',
  events: {
    'Load Success': props<{ loans: LoanDetail[] }>(),
    'Load Failure': emptyProps(),
    'Load Members Success': props<{ members: Member[] }>(),
    'Load Books Success': props<{ books: Book[] }>(),
    'Save Success': emptyProps(),
    'Save Failure': emptyProps(),
    'Return Success': emptyProps(),
    'Return Failure': emptyProps(),
  },
});
```

- [ ] **Step 2: Write the failing reducer tests**

`src/app/loans/store/loans.reducer.spec.ts`:

```ts
import { LoanDetail } from '../../core/models/loan';
import { LoansApiActions, LoansPageActions } from './loans.actions';
import { initialLoansState, loansReducer } from './loans.reducer';

describe('loansReducer', () => {
  const loan: LoanDetail = {
    id: 7, bookId: 1, memberId: 2,
    loanDate: '2026-06-01T00:00:00+00:00', dueDate: '2026-06-15T00:00:00+00:00',
    isReturned: false, isOverdue: false,
    book: { id: 1, title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', year: 2008, categoryId: 3, isAvailable: false },
  };

  it('stores loans and sets loaded on loadSuccess', () => {
    const state = loansReducer(initialLoansState, LoansApiActions.loadSuccess({ loans: [loan] }));
    expect(state.loaded).toBeTrue();
    expect(state.loans.ids).toEqual([7]);
  });

  it('toggleShowReturned updates the flag', () => {
    const state = loansReducer(initialLoansState, LoansPageActions.toggleShowReturned({ showReturned: true }));
    expect(state.showReturned).toBeTrue();
  });

  it('openDialog opens with an empty, invalid form', () => {
    const state = loansReducer(initialLoansState, LoansPageActions.openDialog());
    expect(state.dialog.open).toBeTrue();
    expect(state.loanForm.value).toEqual({ bookId: null, memberId: null });
    expect(state.loanForm.isInvalid).toBeTrue();
  });

  it('saveSuccess closes the dialog and clears saving', () => {
    const opened = loansReducer(initialLoansState, LoansPageActions.openDialog());
    const saving = loansReducer(opened, LoansPageActions.save());
    expect(saving.saving).toBeTrue();

    const state = loansReducer(saving, LoansApiActions.saveSuccess());
    expect(state.saving).toBeFalse();
    expect(state.dialog.open).toBeFalse();
  });

  it('saveFailure keeps the dialog open', () => {
    const opened = loansReducer(initialLoansState, LoansPageActions.openDialog());
    const saving = loansReducer(opened, LoansPageActions.save());
    const state = loansReducer(saving, LoansApiActions.saveFailure());
    expect(state.saving).toBeFalse();
    expect(state.dialog.open).toBeTrue();
  });

  it('stores lookup books and members', () => {
    const withBooks = loansReducer(initialLoansState, LoansApiActions.loadBooksSuccess({
      books: [{ id: 1, title: 'T', author: 'A', isbn: 'I', year: 2000, categoryId: 1, isAvailable: true }],
    }));
    expect(withBooks.books.length).toBe(1);

    const withMembers = loansReducer(initialLoansState, LoansApiActions.loadMembersSuccess({
      members: [{ id: 2, firstName: 'Jana', lastName: 'Novakova', email: 'jana@example.com' }],
    }));
    expect(withMembers.members.length).toBe(1);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail, then implement the reducer**

Run: `npm test -- --watch=false --browsers=ChromeHeadless` — expected FAIL.

`src/app/loans/store/loans.reducer.ts`:

```ts
import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import {
  FormGroupState, onNgrxForms, updateGroup, validate, wrapReducerWithFormStateUpdate,
} from 'ngrx-forms';
import { required } from 'ngrx-forms/validation';
import { Book } from '../../core/models/book';
import { LoanDetail } from '../../core/models/loan';
import { Member } from '../../core/models/member';
import { createLoanFormState, emptyLoanFormValue, LoanFormValue } from './loan-form';
import { LoansApiActions, LoansPageActions } from './loans.actions';

export const loansFeatureKey = 'loans';

export const loansAdapter = createEntityAdapter<LoanDetail>();

export interface LoansState {
  loans: EntityState<LoanDetail>;
  loaded: boolean;
  saving: boolean;
  showReturned: boolean;
  dialog: { open: boolean };
  loanForm: FormGroupState<LoanFormValue>;
  members: Member[];
  books: Book[];
}

export const initialLoansState: LoansState = {
  loans: loansAdapter.getInitialState(),
  loaded: false,
  saving: false,
  showReturned: false,
  dialog: { open: false },
  loanForm: createLoanFormState(emptyLoanFormValue),
  members: [],
  books: [],
};

const rawReducer = createReducer(
  initialLoansState,
  onNgrxForms(),
  on(LoansApiActions.loadSuccess, (state, { loans }) => ({
    ...state,
    loans: loansAdapter.setAll(loans, state.loans),
    loaded: true,
  })),
  on(LoansApiActions.loadMembersSuccess, (state, { members }) => ({ ...state, members })),
  on(LoansApiActions.loadBooksSuccess, (state, { books }) => ({ ...state, books })),
  on(LoansPageActions.toggleShowReturned, (state, { showReturned }) => ({ ...state, showReturned })),
  on(LoansPageActions.openDialog, state => ({
    ...state,
    dialog: { open: true },
    loanForm: createLoanFormState(emptyLoanFormValue),
  })),
  on(LoansPageActions.closeDialog, state => ({ ...state, dialog: { open: false } })),
  on(LoansPageActions.save, state => ({ ...state, saving: true })),
  on(LoansApiActions.saveSuccess, state => ({
    ...state,
    saving: false,
    dialog: { open: false },
  })),
  on(LoansApiActions.saveFailure, state => ({ ...state, saving: false })),
);

export const validateLoanForm = updateGroup<LoanFormValue>({
  bookId: validate(required),
  memberId: validate(required),
});

export const loansReducer = wrapReducerWithFormStateUpdate(
  rawReducer,
  state => state.loanForm,
  validateLoanForm,
);
```

Run: `npm test -- --watch=false --browsers=ChromeHeadless` — expected PASS.

- [ ] **Step 4: Write the failing selector tests**

`src/app/loans/store/loans.selectors.spec.ts`:

```ts
import { LoanDetail } from '../../core/models/loan';
import { Member } from '../../core/models/member';
import { selectAvailableBookOptions, selectLoansVm } from './loans.selectors';

describe('loans selectors', () => {
  const member: Member = { id: 2, firstName: 'Jana', lastName: 'Novakova', email: 'jana@example.com' };

  const activeLoan: LoanDetail = {
    id: 7, bookId: 1, memberId: 2,
    loanDate: '2026-06-01T00:00:00+00:00', dueDate: '2026-06-15T00:00:00+00:00',
    isReturned: false, isOverdue: false,
    book: { id: 1, title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', year: 2008, categoryId: 3, isAvailable: false },
  };

  const returnedLoan: LoanDetail = { ...activeLoan, id: 8, isReturned: true };
  const overdueLoan: LoanDetail = { ...activeLoan, id: 9, isOverdue: true };

  it('joins member name and computes status', () => {
    const vm = selectLoansVm.projector([activeLoan, overdueLoan], [member], false);
    expect(vm[0]).toEqual(jasmine.objectContaining({
      id: 7, bookTitle: 'Clean Code', memberName: 'Jana Novakova', status: 'Active',
    }));
    expect(vm[1].status).toBe('Overdue');
  });

  it('hides returned loans when showReturned is false', () => {
    const vm = selectLoansVm.projector([activeLoan, returnedLoan], [member], false);
    expect(vm.length).toBe(1);
    expect(vm[0].id).toBe(7);
  });

  it('includes returned loans when showReturned is true', () => {
    const vm = selectLoansVm.projector([activeLoan, returnedLoan], [member], true);
    expect(vm.length).toBe(2);
    expect(vm[1].status).toBe('Returned');
  });

  it('falls back to ids when lookups are missing', () => {
    const vm = selectLoansVm.projector([{ ...activeLoan, book: null }], [], false);
    expect(vm[0].bookTitle).toBe('#1');
    expect(vm[0].memberName).toBe('#2');
  });

  it('selectAvailableBookOptions filters to available books', () => {
    const books = [
      { id: 1, title: 'A', author: '', isbn: '', year: 2000, categoryId: 1, isAvailable: true },
      { id: 2, title: 'B', author: '', isbn: '', year: 2000, categoryId: 1, isAvailable: false },
    ];
    const options = selectAvailableBookOptions.projector(books);
    expect(options.map(b => b.id)).toEqual([1]);
  });
});
```

- [ ] **Step 5: Run tests to verify they fail, then implement selectors**

Run: `npm test -- --watch=false --browsers=ChromeHeadless` — expected FAIL.

`src/app/loans/store/loans.selectors.ts`:

```ts
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { loansAdapter, loansFeatureKey, LoansState } from './loans.reducer';

export const selectLoansState = createFeatureSelector<LoansState>(loansFeatureKey);

const entitySelectors = loansAdapter.getSelectors();

export const selectAllLoans = createSelector(selectLoansState, s => entitySelectors.selectAll(s.loans));
export const selectLoansLoaded = createSelector(selectLoansState, s => s.loaded);
export const selectShowReturned = createSelector(selectLoansState, s => s.showReturned);
export const selectMembers = createSelector(selectLoansState, s => s.members);
export const selectLookupBooks = createSelector(selectLoansState, s => s.books);
export const selectLoansDialogOpen = createSelector(selectLoansState, s => s.dialog.open);
export const selectLoanForm = createSelector(selectLoansState, s => s.loanForm);
export const selectLoansSaving = createSelector(selectLoansState, s => s.saving);

export interface LoanVm {
  id: number;
  bookTitle: string;
  memberName: string;
  loanDate: string;
  dueDate: string;
  status: 'Active' | 'Overdue' | 'Returned';
  isReturned: boolean;
}

export const selectLoansVm = createSelector(
  selectAllLoans,
  selectMembers,
  selectShowReturned,
  (loans, members, showReturned): LoanVm[] =>
    loans
      .filter(l => showReturned || !l.isReturned)
      .map(l => {
        const member = members.find(m => m.id === l.memberId);
        return {
          id: l.id,
          bookTitle: l.book?.title ?? `#${l.bookId}`,
          memberName: member ? `${member.firstName} ${member.lastName}` : `#${l.memberId}`,
          loanDate: l.loanDate,
          dueDate: l.dueDate,
          status: l.isReturned ? 'Returned' : l.isOverdue ? 'Overdue' : 'Active',
          isReturned: l.isReturned,
        };
      }),
);

export const selectAvailableBookOptions = createSelector(
  selectLookupBooks,
  books => books.filter(b => b.isAvailable),
);
```

Run: `npm test -- --watch=false --browsers=ChromeHeadless` — expected PASS.

- [ ] **Step 6: Write the failing effects tests**

`src/app/loans/store/loans.effects.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MessageService } from 'primeng/api';
import { Observable, of, throwError } from 'rxjs';
import { LoanDetail } from '../../core/models/loan';
import { BooksApiService } from '../../core/services/books-api.service';
import { LoansApiService } from '../../core/services/loans-api.service';
import { MembersApiService } from '../../core/services/members-api.service';
import { createLoanFormState } from './loan-form';
import { LoansApiActions, LoansPageActions } from './loans.actions';
import { validateLoanForm } from './loans.reducer';
import { LoansEffects } from './loans.effects';
import { selectLoanForm, selectLoansLoaded, selectMembers } from './loans.selectors';

describe('LoansEffects', () => {
  let actions$: Observable<Action>;
  let effects: LoansEffects;
  let loansApi: jasmine.SpyObj<LoansApiService>;

  const loan: LoanDetail = {
    id: 7, bookId: 1, memberId: 2,
    loanDate: '2026-06-01T00:00:00+00:00', dueDate: '2026-06-15T00:00:00+00:00',
    isReturned: false, isOverdue: false, book: null,
  };

  const validForm = validateLoanForm(createLoanFormState({ bookId: 1, memberId: 2 }));

  beforeEach(() => {
    loansApi = jasmine.createSpyObj('LoansApiService', ['getDetailAll', 'create', 'returnBook']);
    const booksApi = jasmine.createSpyObj('BooksApiService', ['getAll']);
    booksApi.getAll.and.returnValue(of([]));
    const membersApi = jasmine.createSpyObj('MembersApiService', ['getAll']);
    membersApi.getAll.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        LoansEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          selectors: [
            { selector: selectLoansLoaded, value: false },
            { selector: selectMembers, value: [] },
            { selector: selectLoanForm, value: validForm },
          ],
        }),
        { provide: LoansApiService, useValue: loansApi },
        { provide: BooksApiService, useValue: booksApi },
        { provide: MembersApiService, useValue: membersApi },
        { provide: MessageService, useValue: jasmine.createSpyObj('MessageService', ['add']) },
      ],
    });

    effects = TestBed.inject(LoansEffects);
  });

  it('load$ fetches loan details when not loaded', (done) => {
    loansApi.getDetailAll.and.returnValue(of([loan]));
    actions$ = of(LoansPageActions.opened());

    effects.load$.subscribe(action => {
      expect(action).toEqual(LoansApiActions.loadSuccess({ loans: [loan] }));
      done();
    });
  });

  it('save$ creates a loan from the form value', (done) => {
    loansApi.create.and.returnValue(of(7));
    actions$ = of(LoansPageActions.save());

    effects.save$.subscribe(action => {
      expect(loansApi.create).toHaveBeenCalledWith({ bookId: 1, memberId: 2 });
      expect(action).toEqual(LoansApiActions.saveSuccess());
      done();
    });
  });

  it('save$ maps API errors to saveFailure', (done) => {
    loansApi.create.and.returnValue(throwError(() => new Error('409')));
    actions$ = of(LoansPageActions.save());

    effects.save$.subscribe(action => {
      expect(action).toEqual(LoansApiActions.saveFailure());
      done();
    });
  });

  it('return$ calls the return endpoint', (done) => {
    loansApi.returnBook.and.returnValue(of(void 0));
    actions$ = of(LoansPageActions.returnBook({ id: 7 }));

    effects.return$.subscribe(action => {
      expect(loansApi.returnBook).toHaveBeenCalledWith(7);
      expect(action).toEqual(LoansApiActions.returnSuccess());
      done();
    });
  });

  it('refresh$ refetches after returnSuccess', (done) => {
    loansApi.getDetailAll.and.returnValue(of([loan]));
    actions$ = of(LoansApiActions.returnSuccess());

    effects.refresh$.subscribe(action => {
      expect(action).toEqual(LoansApiActions.loadSuccess({ loans: [loan] }));
      done();
    });
  });
});
```

- [ ] **Step 7: Run tests to verify they fail, then implement effects**

Run: `npm test -- --watch=false --browsers=ChromeHeadless` — expected FAIL.

`src/app/loans/store/loans.effects.ts`:

```ts
import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { MarkAsSubmittedAction } from 'ngrx-forms';
import { MessageService } from 'primeng/api';
import { EMPTY, catchError, exhaustMap, filter, from, map, of, switchMap, tap } from 'rxjs';
import { BooksApiService } from '../../core/services/books-api.service';
import { LoansApiService } from '../../core/services/loans-api.service';
import { MembersApiService } from '../../core/services/members-api.service';
import { LOAN_FORM_ID } from './loan-form';
import { LoansApiActions, LoansPageActions } from './loans.actions';
import { selectLoanForm, selectLoansLoaded, selectMembers } from './loans.selectors';

@Injectable()
export class LoansEffects {
  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoansPageActions.opened),
      concatLatestFrom(() => this.store.select(selectLoansLoaded)),
      filter(([, loaded]) => !loaded),
      switchMap(() =>
        this.loansApi.getDetailAll().pipe(
          map(loans => LoansApiActions.loadSuccess({ loans })),
          catchError(() => of(LoansApiActions.loadFailure())),
        ),
      ),
    ),
  );

  refresh$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoansApiActions.saveSuccess, LoansApiActions.returnSuccess),
      switchMap(() =>
        this.loansApi.getDetailAll().pipe(
          map(loans => LoansApiActions.loadSuccess({ loans })),
          catchError(() => of(LoansApiActions.loadFailure())),
        ),
      ),
    ),
  );

  loadMembers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoansPageActions.opened),
      concatLatestFrom(() => this.store.select(selectMembers)),
      filter(([, members]) => members.length === 0),
      switchMap(() =>
        this.membersApi.getAll().pipe(
          map(members => LoansApiActions.loadMembersSuccess({ members })),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );

  loadBooks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoansPageActions.openDialog),
      switchMap(() =>
        this.booksApi.getAll().pipe(
          map(books => LoansApiActions.loadBooksSuccess({ books })),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );

  save$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoansPageActions.save),
      concatLatestFrom(() => this.store.select(selectLoanForm)),
      exhaustMap(([, form]) => {
        if (form.isInvalid) {
          return from<Action>([
            new MarkAsSubmittedAction(LOAN_FORM_ID),
            LoansApiActions.saveFailure(),
          ]);
        }
        return this.loansApi.create({ bookId: form.value.bookId!, memberId: form.value.memberId! }).pipe(
          map(() => LoansApiActions.saveSuccess()),
          catchError(() => of(LoansApiActions.saveFailure())),
        );
      }),
    ),
  );

  return$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LoansPageActions.returnBook),
      exhaustMap(({ id }) =>
        this.loansApi.returnBook(id).pipe(
          map(() => LoansApiActions.returnSuccess()),
          catchError(() => of(LoansApiActions.returnFailure())),
        ),
      ),
    ),
  );

  saveSuccessToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(LoansApiActions.saveSuccess),
        tap(() => this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Loan created.' })),
      ),
    { dispatch: false },
  );

  returnSuccessToast$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(LoansApiActions.returnSuccess),
        tap(() => this.messageService.add({ severity: 'success', summary: 'Returned', detail: 'Book returned.' })),
      ),
    { dispatch: false },
  );

  constructor(
    private actions$: Actions,
    private store: Store,
    private loansApi: LoansApiService,
    private booksApi: BooksApiService,
    private membersApi: MembersApiService,
    private messageService: MessageService,
  ) {}
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm test -- --watch=false --browsers=ChromeHeadless`
Expected: all PASS.

- [ ] **Step 9: Commit**

```bash
git add src/BooksLibrary.WebApp/src/app/loans/store
git commit -m "feat: add loans NgRx feature slice with member join and return flow"
```

---

### Task 10: Loans UI (module, page, dialog)

**Files:**
- Modify: `src/app/loans/loans.module.ts` (replace the Task 6 placeholder)
- Create: `src/app/loans/loans-page/loans-page.component.ts`
- Create: `src/app/loans/loans-page/loans-page.component.html`
- Create: `src/app/loans/loan-dialog/loan-dialog.component.ts`
- Create: `src/app/loans/loan-dialog/loan-dialog.component.html`
- Test: `src/app/loans/loans-page/loans-page.component.spec.ts`

- [ ] **Step 1: Write the failing component test**

`src/app/loans/loans-page/loans-page.component.spec.ts`:

```ts
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { LoansPageActions } from '../store/loans.actions';
import { LoanVm, selectLoansVm, selectShowReturned } from '../store/loans.selectors';
import { LoansPageComponent } from './loans-page.component';

describe('LoansPageComponent', () => {
  let fixture: ComponentFixture<LoansPageComponent>;
  let store: MockStore;

  const vm: LoanVm[] = [{
    id: 7, bookTitle: 'Clean Code', memberName: 'Jana Novakova',
    loanDate: '2026-06-01T00:00:00+00:00', dueDate: '2026-06-15T00:00:00+00:00',
    status: 'Active', isReturned: false,
  }];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoansPageComponent],
      imports: [TableModule, FormsModule, NoopAnimationsModule],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectLoansVm, value: vm },
            { selector: selectShowReturned, value: false },
          ],
        }),
        ConfirmationService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
    fixture = TestBed.createComponent(LoansPageComponent);
    fixture.detectChanges();
  });

  it('dispatches opened on init', () => {
    expect(store.dispatch).toHaveBeenCalledWith(LoansPageActions.opened());
  });

  it('renders loan rows with book title and member name', () => {
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Clean Code');
    expect(text).toContain('Jana Novakova');
  });

  it('dispatches toggleShowReturned when the toggle changes', () => {
    fixture.componentInstance.onToggleReturned(true);
    expect(store.dispatch).toHaveBeenCalledWith(LoansPageActions.toggleShowReturned({ showReturned: true }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --watch=false --browsers=ChromeHeadless`
Expected: FAIL — component does not exist.

- [ ] **Step 3: Implement the page component**

`src/app/loans/loans-page/loans-page.component.ts`:

```ts
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ConfirmationService } from 'primeng/api';
import { LoansPageActions } from '../store/loans.actions';
import { LoanVm, selectLoansVm, selectShowReturned } from '../store/loans.selectors';

@Component({
  selector: 'app-loans-page',
  templateUrl: './loans-page.component.html',
})
export class LoansPageComponent implements OnInit {
  vm$ = this.store.select(selectLoansVm);
  showReturned$ = this.store.select(selectShowReturned);

  constructor(
    private store: Store,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.store.dispatch(LoansPageActions.opened());
  }

  onNew(): void {
    this.store.dispatch(LoansPageActions.openDialog());
  }

  onToggleReturned(showReturned: boolean): void {
    this.store.dispatch(LoansPageActions.toggleShowReturned({ showReturned }));
  }

  onReturn(loan: LoanVm): void {
    this.confirmationService.confirm({
      message: `Return "${loan.bookTitle}"?`,
      header: 'Confirm return',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.store.dispatch(LoansPageActions.returnBook({ id: loan.id })),
    });
  }
}
```

`src/app/loans/loans-page/loans-page.component.html`:

```html
<p-toolbar styleClass="mb-3">
  <ng-template pTemplate="left">
    <h2 class="m-0">Loans</h2>
  </ng-template>
  <ng-template pTemplate="right">
    <div class="flex align-items-center gap-3">
      <div class="flex align-items-center gap-2">
        <p-checkbox
          inputId="showReturned"
          [binary]="true"
          [ngModel]="showReturned$ | async"
          (onChange)="onToggleReturned($event.checked)">
        </p-checkbox>
        <label for="showReturned">Show returned</label>
      </div>
      <button pButton label="New Loan" icon="pi pi-plus" (click)="onNew()"></button>
    </div>
  </ng-template>
</p-toolbar>

<p-table [value]="(vm$ | async) ?? []" styleClass="p-datatable-sm">
  <ng-template pTemplate="header">
    <tr>
      <th>Book</th>
      <th>Member</th>
      <th>Loaned</th>
      <th>Due</th>
      <th>Status</th>
      <th style="width: 8rem"></th>
    </tr>
  </ng-template>
  <ng-template pTemplate="body" let-loan>
    <tr>
      <td>{{ loan.bookTitle }}</td>
      <td>{{ loan.memberName }}</td>
      <td>{{ loan.loanDate | date: 'yyyy-MM-dd' }}</td>
      <td>{{ loan.dueDate | date: 'yyyy-MM-dd' }}</td>
      <td>
        <p-tag
          [value]="loan.status"
          [severity]="loan.status === 'Returned' ? 'success' : loan.status === 'Overdue' ? 'danger' : 'info'">
        </p-tag>
      </td>
      <td>
        <button
          *ngIf="!loan.isReturned"
          pButton
          label="Return"
          class="p-button-sm p-button-outlined"
          (click)="onReturn(loan)">
        </button>
      </td>
    </tr>
  </ng-template>
  <ng-template pTemplate="emptymessage">
    <tr><td colspan="6">No loans found.</td></tr>
  </ng-template>
</p-table>

<app-loan-dialog></app-loan-dialog>
<p-confirmDialog [style]="{ width: '24rem' }"></p-confirmDialog>
```

- [ ] **Step 4: Implement the dialog component**

`src/app/loans/loan-dialog/loan-dialog.component.ts`:

```ts
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { LoansPageActions } from '../store/loans.actions';
import {
  selectAvailableBookOptions, selectLoanForm, selectLoansDialogOpen, selectLoansSaving, selectMembers,
} from '../store/loans.selectors';

@Component({
  selector: 'app-loan-dialog',
  templateUrl: './loan-dialog.component.html',
})
export class LoanDialogComponent {
  open$ = this.store.select(selectLoansDialogOpen);
  form$ = this.store.select(selectLoanForm);
  saving$ = this.store.select(selectLoansSaving);
  bookOptions$ = this.store.select(selectAvailableBookOptions);
  memberOptions$ = this.store.select(selectMembers);

  constructor(private store: Store) {}

  onSave(): void {
    this.store.dispatch(LoansPageActions.save());
  }

  onClose(): void {
    this.store.dispatch(LoansPageActions.closeDialog());
  }
}
```

`src/app/loans/loan-dialog/loan-dialog.component.html`:

```html
<p-dialog
  [visible]="(open$ | async) ?? false"
  (onHide)="onClose()"
  [modal]="true"
  [style]="{ width: '26rem' }"
  header="New Loan"
  [closable]="true">

  <div class="p-fluid" *ngIf="form$ | async as form">
    <div class="field">
      <label for="book">Book (available only)</label>
      <p-dropdown
        inputId="book"
        [options]="(bookOptions$ | async) ?? []"
        optionLabel="title"
        optionValue="id"
        placeholder="Select a book"
        [filter]="true"
        [ngrxFormControlState]="form.controls.bookId">
      </p-dropdown>
      <small class="p-error" *ngIf="form.controls.bookId.isInvalid && (form.controls.bookId.isTouched || form.isSubmitted)">
        Book is required.
      </small>
    </div>

    <div class="field">
      <label for="member">Member</label>
      <p-dropdown
        inputId="member"
        [options]="(memberOptions$ | async) ?? []"
        optionValue="id"
        placeholder="Select a member"
        [filter]="true"
        filterBy="firstName,lastName"
        [ngrxFormControlState]="form.controls.memberId">
        <ng-template let-member pTemplate="item">{{ member.firstName }} {{ member.lastName }}</ng-template>
        <ng-template let-member pTemplate="selectedItem">{{ member.firstName }} {{ member.lastName }}</ng-template>
      </p-dropdown>
      <small class="p-error" *ngIf="form.controls.memberId.isInvalid && (form.controls.memberId.isTouched || form.isSubmitted)">
        Member is required.
      </small>
    </div>
  </div>

  <ng-template pTemplate="footer">
    <button pButton label="Cancel" class="p-button-text" (click)="onClose()"></button>
    <button pButton label="Create" [disabled]="(saving$ | async) ?? false" (click)="onSave()"></button>
  </ng-template>
</p-dialog>
```

- [ ] **Step 5: Replace the placeholder LoansModule**

`src/app/loans/loans.module.ts` (replace contents):

```ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { SharedModule } from '../shared/shared.module';
import { LoanDialogComponent } from './loan-dialog/loan-dialog.component';
import { LoansPageComponent } from './loans-page/loans-page.component';
import { LoansEffects } from './store/loans.effects';
import { loansFeatureKey, loansReducer } from './store/loans.reducer';

const routes: Routes = [{ path: '', component: LoansPageComponent }];

@NgModule({
  declarations: [LoansPageComponent, LoanDialogComponent],
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    StoreModule.forFeature(loansFeatureKey, loansReducer),
    EffectsModule.forFeature([LoansEffects]),
  ],
})
export class LoansModule {}
```

- [ ] **Step 6: Run tests and build**

```bash
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

Expected: all tests PASS, build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/BooksLibrary.WebApp/src/app/loans
git commit -m "feat: add loans page and dialog with return flow"
```

---

### Task 11: End-to-end verification and docs

**Files:**
- Modify: `CLAUDE.md` (frontend commands + status)

- [ ] **Step 1: Run both test suites**

```bash
# repo root
dotnet test BooksLibrary.slnx
# src/BooksLibrary.WebApp
npm test -- --watch=false --browsers=ChromeHeadless
```

Expected: all pass.

- [ ] **Step 2: Manual smoke test against the real API**

Terminal 1 (repo root): `dotnet run --project src/BooksLibrary.Api`
Terminal 2 (src/BooksLibrary.WebApp): `npm start`
Open `http://localhost:4200` and verify this checklist:

1. Books table loads with seeded data and category names.
2. Create a book → success toast, appears in the table.
3. Edit the book → fields pre-filled, save updates the row.
4. Save with empty title → inline validation error, dialog stays open.
5. Delete the book → confirm dialog, then gone.
6. Loans page shows seeded loans with member names and status pills.
7. Create a loan → book becomes "On loan" on the Books page; the book disappears from the New Loan dropdown.
8. Create loans until a member has 5 active → 6th attempt shows the business-rule toast and the dialog stays open.
9. Return a loan → status flips (visible via "Show returned" toggle), book is available again.

If anything fails, debug using superpowers:systematic-debugging before proceeding.

- [ ] **Step 3: Update CLAUDE.md**

In the "Build & Run Commands" section, add after the existing dotnet commands:

```markdown
Frontend (from `src/BooksLibrary.WebApp`):

```bash
npm start                                            # ng serve with API proxy on :4200
npm test -- --watch=false --browsers=ChromeHeadless  # Karma single run
npm run build
```
```

In "Planned Evolution", change item 2 to:

```markdown
2. **In progress**: Angular SPA frontend (Angular 15 + PrimeNG + NgRx; Books + Loans done, Members/Categories screens and the upgrade path to 20/21 pending)
```

Also add a short **Frontend architecture** note under Architecture:

```markdown
### Frontend (`src/BooksLibrary.WebApp`)

Angular 15 + PrimeNG 15 + NgRx 15 + ngrx-forms (deliberately legacy — mirrors Masha before its upgrade).
`core/` (API services, error interceptor), `shared/` (PrimeNG re-exports), lazy `books/` and `loans/`
feature modules each with their own NgRx slice (`store/` folder: actions, reducer with ngrx-forms,
selectors incl. view-model joins, effects). Dev proxy `proxy.conf.json` forwards `/api` to the .NET API
(`http://localhost:5087`) — start the API before `npm start`.
```

- [ ] **Step 4: Final commit**

```bash
git add CLAUDE.md
git commit -m "docs: add frontend commands and architecture to CLAUDE.md"
```

- [ ] **Step 5: Verify working tree is clean and history is sane**

```bash
git status
git log --oneline -15
```

Expected: clean tree (ignore `obj/`/`bin/` noise), one commit per task.