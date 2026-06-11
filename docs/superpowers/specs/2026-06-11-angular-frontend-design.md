# Angular Frontend for BooksLibrary — Design

**Date:** 2026-06-11
**Status:** Approved

## Purpose

Build the frontend phase of the onboarding training project: an Angular SPA consuming
the existing BooksLibrary .NET API. The stack deliberately mirrors Masha's *current*
(legacy) frontend so the developer experiences the starting point of the planned
Angular 15 → 20/21 upgrade. Building modern-first would defeat the purpose.

## Stack (fixed by onboarding spec)

| Layer | Choice |
|---|---|
| Framework | Angular 15.2, NgModules (no standalone) |
| Workspace | Angular CLI (no Nx) |
| UI | PrimeNG 15 + PrimeFlex + PrimeIcons |
| State | NgRx 15 — Store, Effects, Entity, Router-Store |
| Forms | ngrx-forms 8 |
| Reactive | RxJS 7.5, TypeScript 4.8, zone.js 0.11 |
| Tests | Karma + Jasmine (CLI defaults) |

No authentication — the backend has none.

## Scope

**In scope (phase 1):** Books CRUD screen + Loans screen (create loan, return book).

**Out of scope (later phases):** Members and Categories CRUD screens, the Angular
upgrade exercise, Azure Function. Members and Categories appear only as read-only
dropdown lookups inside dialogs.

## Project structure

App lives in this repo at `src/BooksLibrary.WebApp/`, created with
`ng new --version=15`.

```
src/app/
  core/                       # CoreModule — imported once by AppModule
    models/                   #   DTO interfaces matching backend DTOs (hand-written)
    services/                 #   BooksApiService, LoansApiService,
                              #   CategoriesApiService, MembersApiService (HttpClient)
    interceptors/             #   ApiErrorInterceptor
  shared/                     # SharedModule — PrimeNG module re-exports, common pipes
  books/                      # BooksModule — lazy-loaded at /books
    store/                    #   actions, reducer (+ Entity adapter), selectors, effects
    books-page/               #   p-table list + toolbar
    book-dialog/              #   p-dialog create/edit form (ngrx-forms)
  loans/                      # LoansModule — lazy-loaded at /loans
    store/
    loans-page/               #   loans table with Return action
    loan-dialog/              #   create loan: book + member dropdowns
  app.module.ts               # StoreModule.forRoot({router}), EffectsModule.forRoot,
                              # StoreRouterConnectingModule, StoreDevtoolsModule (dev)
```

- **Layout:** PrimeNG Menubar across the top (Books | Loans), full-width content below.
- **Routing:** `/books` and `/loans` via `loadChildren`; default redirect → `/books`.
- **Forms UX:** create/edit in modal dialogs (p-dialog) over the table, not routed pages.
- **Dev API access:** Angular dev-server proxy (`proxy.conf.json`) forwards `/api/*`
  to the running .NET API. No CORS changes on the backend. `environment.ts` holds
  `apiUrl: '/api'`.

## NgRx state design

### Books slice (feature key `books`)

```ts
interface BooksState {
  books: EntityState<Book>;        // @ngrx/entity adapter, keyed by id
  loaded: boolean;                 // guards against re-fetching
  saving: boolean;                 // disables Save while POST/PUT in flight
  dialog: { open: boolean; editedId: number | null };
  bookForm: FormGroupState<BookFormValue>;  // title, author, year, categoryId
  categories: Category[];          // dropdown lookup
}
```

- **Actions** use the `[Source] Event` convention in three groups:
  - Page: `[Books Page] Load`, `Open Create Dialog`, `Open Edit Dialog`, `Close Dialog`, `Save`, `Delete`
  - API: `[Books API] Load Success/Failure`, `Save Success/Failure`, `Delete Success/Failure`
  - ngrx-forms actions handled via `onNgrxForms()` in the reducer
- **Effects:** `load$` (GET all), `save$` (POST or PUT by `editedId`; only when form
  valid), `delete$` (after p-confirmDialog accept → DELETE), `loadCategories$`
  (on dialog open, skipped when already cached)
- **Selectors:** `selectAllBooks`, `selectDialogOpen`, `selectBookForm`,
  `selectSaving`, and a view-model selector joining book → category name for the table

### Loans slice (feature key `loans`)

Same shape, with these differences:

- Table data comes from the backend **detail query** (`GetDetailAllLoansQuery`) so rows
  carry book title + member name, not raw IDs.
- `loanForm`: `bookId`, `memberId` — both required. Lookups: available books + members.
- Extra action pair: `[Loans Page] Return Book` → `[Loans API] Return Success/Failure`,
  calling the return endpoint then reloading the list.
- `showReturned: boolean` flag in state; the list selector filters active vs. all
  client-side.

### Validation

ngrx-forms validators mirror the backend FluentValidation rules (required fields,
year range) so most errors surface client-side. The backend stays the source of
truth; its rejections still render correctly (see error handling).

## Screens & UX

**Books (`/books`):** p-table — Title, Author, Year, Category, Available. Toolbar
"+ New Book". Row actions Edit / Delete (Delete behind p-confirmDialog). Success →
p-toast; table updates from the store.

**Loans (`/loans`):** p-table of loan detail rows — Book, Member, Loaned date,
Status (Active pill / Returned + date pill). "Show returned" toggle (default off)
filters client-side. "+ New Loan" opens dialog with two dropdowns: available books
only, and members. "Return" button only on active rows, behind a confirm dialog.

**Business-rule rejections** (max 5 active loans, book unavailable) return as API
errors → shown as an error toast; the dialog stays open so the user can change the
selection.

## Error handling

- Single `ApiErrorInterceptor` in core:
  - 400 (validation / business rule) → extract backend message → `MessageService`
    error toast with that text
  - 500 / network → generic "Something went wrong" toast
- Effects still dispatch `...Failure` actions so the store resets `saving` and keeps
  dialog state correct. The interceptor owns only the user-facing message; state
  transitions stay in the reducer.

## Testing

Karma + Jasmine as generated by the CLI.

- **Reducers:** dialog open/close, entity upsert on `Load Success`, form reset on
  `Save Success`.
- **Selectors:** view-model join (book + category name), active-loan filter.
- **Effects:** `provideMockActions` + mocked API services — happy and failure path
  of `save$` for both features; `return$` for loans.
- **Components:** a small number — e.g. books page renders rows from a mocked store.
  Not exhaustive; component testing depth is a non-goal.

## Future phases (not in this spec)

1. Members + Categories CRUD screens (copy the feature-module pattern).
2. Angular upgrade exercise 15 → 16 → 17 → … → 20/21 (`ng update` per major,
   standalone migration, new control flow, signals, PrimeNG Aura theming).
3. Azure Function (timer trigger, CSV export).