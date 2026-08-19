# Common — Architecture & Usage Guide

This folder is the foundation every feature in the API is built on. It defines
one consistent way to represent an operation's outcome, one consistent way to
turn that outcome into an HTTP response, and one consistent way to catch
whatever slips past both.

If you're adding a new feature (service + controller), you should not need to
invent any new error-handling pattern. Everything you need is already here.

---

## 1. The problem this solves

Without a shared convention, every service ends up choosing its own way to
signal failure — some throw exceptions, some return null, some return a bool
+ out parameter, some return a custom per-feature error type. Every
controller then has to guess how to turn that into an HTTP response, and the
JSON shape of an error response ends up different from endpoint to endpoint.

This folder fixes that by giving the whole API exactly **one channel** for
expressing "this operation succeeded, or it failed for this specific,
typed reason" — the `Result` type — and exactly **one channel** for turning
that into a wire response — `ErrorResponse`, produced by `AppControllerBase`.

Exceptions still exist in .NET and EF Core, and we don't fight that — but
inside our own business logic, exceptions are reserved for truly
*unexpected* failures (a dropped DB connection, a bug). Anything we can
*anticipate* — validation, not-found, conflict, permission — is expressed as
a `Result`, not a throw.

---

## 2. The pipeline, end to end

```
Service layer                Controller layer                 Client
──────────────               ──────────────────                ──────
Error.Create(...)   ──────►  Result.Failure(type, error)  ──►  HandleResult(result)
       │                            │                                │
       │                            │                                ▼
       │                            │                         ErrorResponse (JSON)
       │                            │                                │
       ▼                            ▼                                ▼
 (business rule            (adds ErrorType +               (unified shape sent
  + bilingual message)      success/failure state)          to the frontend)
```

**`Error`** — a value object describing *what* went wrong: a machine-readable
`Code`, an English message (for logs/devs), and an Arabic message (for
end-user display). This is the only place a business-rule failure gets
described. Nothing downstream invents its own wording.

**`Result` / `Result<T>`** — wraps an `Error` with the *flow-control*
information a controller needs: did the operation succeed, and if not, what
*category* of failure is it (`ErrorType`)? This is what service methods
return. `Result<T>` additionally carries the success payload.

**`ErrorResponse`** — the DTO that actually gets serialized to JSON and sent
to the frontend. It is intentionally a separate type from `Error`, because it
carries something `Error` doesn't (and shouldn't) know about: a `TraceId` for
support/debugging correlation. `Error` is a domain concept; `ErrorResponse`
is a transport concept. Keeping them separate means either one can change
shape without forcing a change in the other.

**`AppControllerBase`** — the only place that knows how to turn a `Result`
into an `IActionResult`. Every feature controller inherits from this and
calls `HandleResult(...)`, so status-code mapping and logging-by-severity
are defined exactly once for the whole API.

**`GlobalExceptionHandler` / `GlobalErrors`** — the safety net. If something
throws instead of returning a `Result` — a DB failure, a bug, anything
unanticipated — this catches it before it reaches the client and converts it
into the *same* `ErrorResponse` shape everything else uses. The frontend
never has to special-case "was this a Result failure or an unhandled
exception" — the JSON contract is identical either way.

**`ModelStateErrors` / `ServiceCollectionExtensions`** — wires ASP.NET
Core's own automatic model validation (from `[ApiController]` +
data-annotation attributes) into the same `ErrorResponse` shape, so even
failures that never touch our `Result` type (malformed request body, missing
required field) still come back looking like every other error.

---

## 3. File-by-file reference

### `1.Results/Error.cs`
Immutable value object: `Code`, `MessageEn`, `MessageAr`.

- Construction only through `Error.Create(code, messageEn, messageAr)`,
  which validates all three are non-empty and trims whitespace. The
  constructor itself is private — there is no way to build an `Error` with
  a blank code or message.
- `Error.None()` is the internal "no error" sentinel used by `Result`'s
  success path. It is not meant to be used by feature code — if you find
  yourself reaching for it outside `Results.cs`, you probably want
  `Result.Success()` instead.
- `sealed` — nothing should ever derive from `Error` to work around
  `Create`'s validation.

### `1.Results/ErrorResponse.cs`
The wire DTO. Built exclusively via `ErrorResponse.FromError(error, traceId?)`.

- `TraceId` is populated **only** by `GlobalExceptionHandler`, i.e. only
  for genuinely unexpected failures (unhandled exceptions, DB errors). This
  is a deliberate rule, not an inconsistency: a `TraceId` exists so
  someone can grep server logs to find the exception that produced a
  response. A validation failure or a `Result`-based business failure
  (`NotFound`, `Conflict`, etc.) is not a mystery to investigate — we
  already know exactly why it happened and said so in the message, so
  there's nothing in the logs a `TraceId` would help correlate. Both
  `AppControllerBase._ProcessFailure` (ordinary `Result` failures) and
  `ServiceCollectionExtensions._HandleInvalidModelState` (EF/model-state
  validation failures) intentionally call `FromError(error)` with no
  `traceId` — model-state validation is still a *business* error in this
  sense, it's just raised by ASP.NET's own model binder instead of by our
  code, so it gets the same treatment as any other anticipated failure.
- `sealed`, private constructor — same reasoning as `Error`.

### `1.Results/Results.cs`
Defines `ErrorType` (the enum used purely to pick an HTTP status code) and
`Result` / `Result<T>`.

- All invariant validation lives in the `protected Result(...)` constructor
  itself, not in the static factories. The constructor rejects a null
  `Error`, and enforces the relationship between `isSuccess` and
  `errorType`/`error`: a success must carry `ErrorType.None` + `Error.None()`,
  and a failure must carry neither. This means the invariant cannot be
  bypassed no matter how many factories exist or get added later — it is
  enforced at the one place every `Result` must pass through, not
  re-implemented per factory.
  - **Implementation note:** the constructor checks the `isSuccess`
    *parameter* directly (`if (isSuccess && ...)` / `if (!isSuccess && ...)`),
    not the `IsSuccess`/`IsFailure` *properties*. Those properties aren't
    assigned until after the guard clauses run, so checking them inside the
    constructor would silently read stale (default `false`) values. This
    is a real footgun for constructors on records/classes in general —
    worth remembering if this constructor is ever touched again.
- `Result.Success()` / `Result.Failure(type, error)` are the only ways to
  construct a `Result` from outside this file; both now simply forward
  their arguments to the constructor, which does the actual validation.
- `Result<T>` adds `Value`, returned on the success path. Its own
  constructor and factories mirror the same pattern — validation happens
  once, in `Result<T>`'s private constructor via `base(...)`, not
  re-checked in `Result<T>.Success`/`Failure`.
- Both are records with only `{ get; }` properties (no `init`), so
  `with`-expressions cannot be used to mutate a `Result` into an
  inconsistent state after construction.

### `2.Controllers/AppControllerBase.cs`
Base class every feature controller inherits from.

- `HandleResult(result)` / `HandleResult<T>(result)` are the two methods
  you call from an action method — see [§4 Usage](#4-how-to-use-this-in-a-feature-controller).
- Success mapping:
  - No `actionName` passed → `200 OK` (with body for `Result<T>`) or
    `204 No Content` (for `Result`).
  - `actionName` passed → `201 Created`, with the `Location` header
    correctly populated via `CreatedAtAction`. Use this for genuine
    resource-creation endpoints.
- Failure mapping (`ErrorType` → HTTP status), fixed for the whole API:

  | ErrorType      | Status | Logged as   |
  |----------------|--------|-------------|
  | Validation     | 400    | Information |
  | NotFound       | 404    | Information |
  | Conflict       | 409    | Warning     |
  | Unauthorized   | 401    | Warning     |
  | Forbidden      | 403    | Warning     |
  | Failure        | 500    | Error       |

  A feature service should never need to pick an HTTP status directly —
  it picks an `ErrorType`, and this table is the single place that
  decision becomes a status code.

### `3.Exceptions/GlobalErrors.cs`
Two fixed `Error` instances — `DatabaseError` and `InternalServerError` —
used only by `GlobalExceptionHandler`. These are deliberately generic and
never leak stack traces or internals to the client; the real exception is
logged server-side (via `_logger.LogWarning`/`LogError`), not serialized.

### `3.Exceptions/GlobalExceptionHandler.cs`
Registered via `IExceptionHandler`. Catches anything a service/controller
didn't turn into a `Result`.

- Two buckets, deliberately kept simple:
  - `DbUpdateException` → `GlobalErrors.DatabaseError`, logged as a
    *warning* (data-related, often user-recoverable — bad input causing a
    constraint violation, for instance).
  - Everything else → `GlobalErrors.InternalServerError`, logged as an
    *error* (unexpected, needs investigation).
- Both branches always return `true` (handled) and always write a
  `500`. That's intentional: by the time execution reaches here, this
  wasn't a `Result` failure with a known category — it's something we
  didn't anticipate, so `500` is the honest answer regardless of the
  underlying exception type.
- `_SafeWriteResponseAsync` swallows failures to *write* the error
  response (e.g. client already disconnected) — that failure is logged
  but never re-thrown, so it can't mask or replace the original exception
  in the logs.

### `4.Extensions/ModelStateErrors.cs`
Two `Error` factories (`Default`, `Custom(en, ar)`) used only when ASP.NET
Core's automatic `[ApiController]` model validation rejects a request
before it reaches a controller action at all (malformed JSON, a
`[Required]` field missing, etc.). This is a distinct *path* from `Result`
validation failures — see [§4.3](#43-model-level-validation-attributes-vs-result-based-validation)
— but it is treated as the same *category* of error: expected, already
explained by the message, no `TraceId` attached (see `ErrorResponse.cs`
above).

### `4.Extensions/ServiceCollectionExtensions.cs`
`Startup`/`Program.cs` wiring, split into three composable extension
methods:
- `AddAppDatabase` — EF Core + Npgsql registration.
- `AddAppInfrastructure` — controllers, Swagger, the global exception
  handler, and the `InvalidModelStateResponseFactory` override that routes
  automatic model-validation failures through `ModelStateErrors` →
  `ErrorResponse` instead of ASP.NET's default `ValidationProblemDetails`
  shape.
- `AddAppFeatures` — DI registration for every feature service. **Every
  new feature service must be registered here.**

**The `|` bilingual-message convention.** `_GetValidationError` pulls the
first error message off `ModelState` and splits it on `|`:

```csharp
string[] parts = firstError.Split('|');
string msgEn = parts[0].Trim();
string msgAr = parts.Length > 1 ? parts[1].Trim() : msgEn;
```

This means any data-annotation attribute's `ErrorMessage` is expected to
encode **both languages in a single string**, English first:

```csharp
public class CreateTeacherRequest
{
    [Required(ErrorMessage = "Name is required.|الاسم مطلوب.")]
    public string Name { get; set; } = string.Empty;

    [Range(1, 12, ErrorMessage = "Grade must be between 1 and 12.|يجب أن يكون الصف بين 1 و 12.")]
    public int Grade { get; set; }
}
```

If an attribute's `ErrorMessage` has no `|`, `msgAr` silently falls back to
the same English string — there is no warning or build-time check for
this, so an attribute added without the `|` will ship an English message to
Arabic-speaking users without anyone noticing. **Every `ErrorMessage` on a
request DTO must follow the `"English|Arabic"` format.** This only applies
to data-annotation attributes; `Result`-based validation errors already
take English and Arabic as two separate constructor arguments
(`Error.Create(code, messageEn, messageAr)`) and have no such convention to
remember.

---

## 4. How to use this in a feature controller

### 4.1 Standard read / update / delete
```csharp
public class TeachersController : AppControllerBase
{
    private readonly ITeacherService _teacherService;

    public TeachersController(ITeacherService teacherService, ILogger<TeachersController> logger)
        : base(logger) => _teacherService = teacherService;

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        Result<TeacherDto> result = await _teacherService.GetByIdAsync(id);
        return HandleResult(result); // 200 + body, or mapped error
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        Result result = await _teacherService.DeleteAsync(id);
        return HandleResult(result); // 204, or mapped error
    }
}
```

### 4.2 Resource creation (correct `201 Created` + `Location` header)
```csharp
[HttpPost]
public async Task<IActionResult> Create(CreateTeacherRequest request)
{
    Result<TeacherDto> result = await _teacherService.CreateAsync(request);
    return HandleResult(result, nameof(GetById), new { id = result.Value?.Id });
}
```
Only pass `actionName` for genuine resource-creation endpoints. A `POST`
that performs an action (e.g. `POST /teachers/{id}/archive`) is **not**
resource creation — call `HandleResult(result)` with no `actionName` there,
which returns `200`/`204` as appropriate, not `201`.

### 4.3 Model-level validation attributes vs. `Result`-based validation
Two different validation paths exist, and they're intentionally separate:

- **Data-annotation attributes** (`[Required]`, `[MaxLength]`, etc.) on a
  request DTO are checked automatically by `[ApiController]` *before* your
  action method even runs. These failures never reach your service —
  `ModelStateErrors` + `_HandleInvalidModelState` handle them.
- **Business-rule validation** (e.g. "a teacher can't be assigned to a
  class that's already at capacity") can't be expressed as an attribute —
  it needs data or logic. Return `Result.Failure(ErrorType.Validation,
  Error.Create(...))` from the service for these.

Both end up as a `400` with the identical `ErrorResponse` shape, so the
frontend does not need to know or care which path produced it.

### 4.4 Writing a business-rule error in a service
```csharp
if (schoolClass.CurrentEnrollment >= schoolClass.Capacity)
{
    return Result<TeacherDto>.Failure(
        ErrorType.Conflict,
        Error.Create(
            "CLASS_AT_CAPACITY",
            "This class has reached its enrollment capacity.",
            "وصل هذا الفصل إلى الحد الأقصى للسعة."
        )
    );
}
```
Prefer defining reusable `Error` factories per feature (mirroring
`ModelStateErrors`/`GlobalErrors`) once a feature has more than one or two
call sites producing the same error, rather than inlining `Error.Create`
everywhere.

---

## 5. Open questions / future hardening

Noted here deliberately rather than fixed silently, so they're a conscious
choice, not an oversight:

- **`DbUpdateConcurrencyException` is not special-cased.** It currently
  falls into the generic `DbUpdateException` bucket and returns `500`. If
  optimistic concurrency (`RowVersion` / `[ConcurrencyCheck]`) is added to
  any entity, add a dedicated branch in `GlobalExceptionHandler` ahead of
  the `DbUpdateException` check, mapped to `409 Conflict` instead.