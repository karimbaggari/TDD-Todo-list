# TDD Todo List

A Todo List application built with **Next.js**, **Server Actions**, and **JSON file storage** — designed as a companion project for a Medium article about **Test-Driven Development (TDD)**.

The goal of this project is not the todo app itself — it's the testing. Every layer of the application is covered by a different type of test, demonstrating how TDD works in practice and how different testing strategies complement each other.

## Tech Stack

- **Next.js 16** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **Server Actions** for CRUD operations
- **JSON files** for persistence (no database)
- **Jest** for unit, integration, and performance tests
- **Playwright** for smoke, e2e, system, acceptance, usability, and security tests
- **GitHub Actions** for CI

## Project Structure

```
src/
  types/
    todo.ts                     # Todo interface
  helpers/
    json-store.ts               # Generic JSON file read/write/delete helpers
  repositories/
    todo.repository.ts          # Todo-specific data operations
  app/
    actions/
      todo-actions.ts           # Server actions (the entry point for all operations)
    components/
      AddTodoForm.tsx            # Client component — form to add a todo
      TodoItem.tsx               # Client component — toggle and delete a todo
    page.tsx                     # Main page (server component, fetches todos)
    layout.tsx                   # Root layout
```

### How the layers connect

```
UI (page.tsx, components) → Server Actions → Repository → JSON Store → data/*.json
```

Each layer has a single responsibility:
- **Server Actions** handle form data, validation, and cache revalidation
- **Repository** handles business logic (sorting, creating with defaults, updating)
- **JSON Store** handles raw file I/O (read, write, delete JSON files)

## Tests

All tests live in `src/__tests__/`, organized by type:

```
src/__tests__/
  unit/                         # Jest — isolated logic, all dependencies mocked
  integration/                  # Jest — real file I/O, full chain without browser
  smoke/                        # Playwright — does the app boot and not crash?
  e2e/                          # Playwright — simulate real user interactions
  system/                       # Playwright — verify HTTP responses + disk state
  acceptance/                   # Playwright — validate user stories are fulfilled
  performance/                  # Jest — throughput, response time, concurrency
  usability/                    # Playwright — accessibility, keyboard nav, semantics
  security/                     # Jest + Playwright — XSS, path traversal, input sanitization
```

### What each test type covers and why

#### Unit Tests (`npm test`)

Test each layer in isolation with mocked dependencies.

| File | What it tests |
|------|--------------|
| `todo-actions.test.ts` | Server actions call the right repository methods, validate input, revalidate cache |
| `todo-repository.test.ts` | Repository sorts todos, creates with defaults, handles missing data |
| `json-store.test.ts` | File helpers read/write/delete JSON files correctly |

**Why:** Fast feedback. If a unit test fails, you know exactly which function broke. These run in ~0.3s.

#### Integration Tests (`npm test`)

No mocks — server actions call the real repository, which writes real JSON files to a temp directory.

**Why:** Unit tests pass even when the layers don't work together. Integration tests prove the full chain (action → repository → store → disk) actually works.

#### Smoke Tests (`npm run test:smoke`)

4 tests: app returns 200, page renders, can add a todo, can delete a todo.

**Why:** The fastest sanity check. If any of these fail, something is fundamentally broken. Run these first before going deeper.

#### E2E Tests (`npm run test:e2e`)

Full browser tests simulating real user interactions — typing, clicking, verifying the UI updates.

**Why:** Everything below the UI can work perfectly, but if the buttons aren't wired up, the user sees a broken app. E2E tests catch that.

#### System Tests (`npm run test:system`)

Like E2E but also verify system state — HTTP status codes, JSON files on disk, data surviving page reloads.

**Why:** E2E tests verify what the user sees. System tests verify what actually happened behind the scenes (was the file really written? does the data survive a reload?).

#### Acceptance Tests (`npm run test:acceptance`)

Written as user stories: "As a user, I can add a todo", "As a user, my todos are saved".

**Why:** These map directly to requirements. If an acceptance test fails, a user story is broken — not just a function or a button, but an actual thing the user expects to do.

#### Performance Tests (`npm run test:performance`)

Response time thresholds, creating 100 todos under 2 seconds, fetching 500 todos, concurrent operations.

**Why:** Catch performance regressions before they reach production. A slow `getTodos` with 500 files means an accidental O(n^2) loop snuck in.

#### Usability Tests (`npm run test:usability`)

Keyboard navigation (tab, Enter), aria labels on all buttons, semantic HTML (heading, list, form).

**Why:** Accessibility is usability. If a screen reader user can't navigate the app, or a keyboard user can't submit the form, the app is broken for them.

#### Security Tests (`npm run test:security`)

Path traversal (can't read/write outside data dir), XSS (script tags rendered as text), input sanitization (special chars, null bytes, long strings), data integrity (malformed JSON, concurrent writes).

**Why:** Even a simple todo app can have security holes. A crafted ID like `../../etc/passwd` could read system files. A `<script>` tag in a title could execute in the browser.

## Running Tests

```bash
# Unit + Integration (Jest)
npm test

# Individual Playwright suites
npm run test:smoke
npm run test:e2e
npm run test:system
npm run test:acceptance
npm run test:usability

# Performance (Jest)
npm run test:performance

# Security (Jest + Playwright)
npm run test:security
```

## CI Pipeline

GitHub Actions runs on every push and PR to `main`:

1. Install dependencies
2. Unit + Integration tests (`npm test`)
3. Smoke tests (`npm run test:smoke`)

These are the fast, reliable tests that catch real breakage without slowing down the pipeline.

## The TDD Approach

This project was built **tests first**:

1. Write the tests — they fail because nothing is implemented
2. Write the minimum code to make them pass
3. Refactor if needed

The unit tests for server actions and the repository were written before any implementation existed. Running `npm test` showed 28 failures. Then the implementation was written to make them pass — without changing a single test.

This is the core of TDD: tests define the behavior, code fulfills it.
