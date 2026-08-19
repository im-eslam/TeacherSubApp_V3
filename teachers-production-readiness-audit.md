# Teachers Feature — Full-Stack Production Readiness Audit

**Repository:** `TeacherSubApp_V3`
**Scope:** Read-only review of `TeacherSubApp.Api` and `TeacherSubApp.UI` Teachers slice
**Review posture:** Principal Full-Stack Code Review
**Author:** Manus AI

## Executive Summary

The Teachers feature follows the repository’s intended vertical-slice architecture and uses the shared Result/controller pipeline correctly for expected domain outcomes. The entity supports soft deletion, the nullable Subject relationship is configured with `ON DELETE SET NULL`, and teacher deletion soft-deletes active WeeklySchedule rows within a database transaction before soft-deleting the teacher.

The feature is not ready to merge because the service’s duplicate-name guard still uses `EF.Functions.ILike` with raw user input as the pattern. A teacher name containing `%` or `_` can therefore be interpreted as a SQL wildcard, violating the explicit query-safety requirement and potentially producing incorrect conflict decisions. The frontend build, lint, and backend Release compilation pass, but those checks do not remove this logical blocker.

> **Final verdict: `[NEEDS FIXES BEFORE MERGE]`**

## Architectural Decisions Explicitly Accepted

The following were reviewed and intentionally not treated as defects:

| Project rule | Audit treatment |
|---|---|
| `react-aria-components` + Tailwind is the UI standard | Accepted. The Teachers modals use the shared React Aria modal shells; the absence of Shadcn/Radix is not a finding. |
| Case-insensitive uniqueness is enforced in the C# service layer | Accepted as the policy. The audit flags only the current wildcard-sensitive implementation, not the absence of `citext` or expression indexes. |
| Single-admin scope | Accepted. No PostgreSQL `23505` catch block is required; service-level pre-checks are within scope. |
| No automated tests or `dotnet ef database update` | Respected. Neither was run or added. |

## Reviewed Surface

The review covered the Teacher entity and EF configuration, Subject and WeeklySchedule relationship configuration, Teacher DTOs and localized errors, `TeacherService`, `TeachersController`, the frontend API adapter, TanStack Query hooks, TypeScript contracts, `TeacherModals`, `TeachersPage`, shared modal/error infrastructure, and the shared searchable Subject picker. The Subjects, Classes, and Events frontend slices were used as architectural comparison points.

## Backend Assessment

### Entity and persistence configuration

The `Teacher` entity contains `DeletedAt`, `CreatedAt`, and `UpdatedAt` fields. The EF configuration makes `Name` required with a maximum length of 100, leaves `SubjectId` nullable, and defines an active-only unique index on `Name` filtered by `"DeletedAt" IS NULL`.[1] The repository’s case-sensitivity policy intentionally places the authoritative case-insensitive check in the service layer; therefore, the case-sensitive database index is not independently classified as a defect under the supplied rules.

The Subject relationship is correctly nullable and uses `DeleteBehavior.SetNull` with the `FK_Teachers_Subjects` constraint. This means hard deletion of a Subject would detach the teacher rather than delete the teacher record, matching the requested `ON DELETE SET NULL` behavior.[2] The generated EF model snapshot confirms the same relationship and nullable foreign key at the persisted model level.[3]

The Teacher-to-WeeklySchedule relationship is configured with cascade behavior for hard deletion, but the service does not hard-delete teachers. Instead, its delete path explicitly updates active WeeklySchedule rows by setting `DeletedAt` and `UpdatedAt`, then soft-deletes the teacher. The two operations run inside one database transaction, so a failure in the schedule update or teacher update is rolled back before the unexpected exception is rethrown to the global pipeline.[4]

| Backend criterion | Result | Assessment |
|---|---:|---|
| Teacher has `DeletedAt` | Pass | Soft deletion is represented in the entity and EF configuration. |
| Subject FK nullable | Pass | `SubjectId` is nullable and the navigation is optional. |
| Subject delete behavior | Pass | `ON DELETE SET NULL` is configured and represented in the model snapshot. |
| WeeklySchedule soft deletion on teacher delete | Pass | Active schedules are soft-deleted before the teacher inside a transaction. |
| Active-only name index | Pass under project policy | The index is active-only; database-level case insensitivity is intentionally not required. |

### DTOs and validation

`TeacherWriteDto` is strongly typed, requires `Name`, limits it to 100 characters, and supports nullable `SubjectId` plus the `IsSupervisor` flag. `TeacherQuery` exposes optional name, Subject, and supervisor filters. The read DTO returns the teacher identity, Subject identity/name, and supervisor state.[5]

The DTO-to-entity conversion trims names before persistence. The service also trims during updates and performs case-insensitive change detection. The shared validation pipeline is responsible for malformed input responses, while service-level checks handle active Subject validity and duplicate active teacher names. No missing required Teacher field or incorrect nullable Subject contract was identified in the reviewed scope.

### Service-layer Result handling and domain logic

`TeacherService` returns `Result<List<TeacherReadDto>>`, `Result<TeacherReadDto>`, or `Result` for all public operations. Expected outcomes such as missing teachers, duplicate names, and invalid/inactive Subjects are represented as localized domain errors rather than being thrown.[4][6] The controller then delegates response mapping to `HandleResult`, preserving the shared HTTP contract.

The active-only filters are correctly applied to teacher reads, ID lookups, duplicate checks, and Subject validation. Update conflict checks exclude the current teacher ID, so a teacher can be updated without conflicting with itself. Soft deletion also prevents a deleted teacher from being returned or updated through the active service paths.

#### Critical blocker: wildcard-sensitive duplicate-name check

**Severity: Critical — must fix before merge.**

`_CheckNameConflictAsync` trims the input but calls `EF.Functions.ILike(t.Name, clean)` directly.[4] Because `ILike` treats `%` and `_` as pattern characters, a user-supplied name containing either character is not compared as a literal normalized string. This can cause false conflicts or allow a logically duplicate name to pass depending on the stored names and pattern shape. It directly violates the requested safe normalized equality rule.

The fix should replace the predicate with a provider-translatable normalized equality comparison, preserving the existing active-only filter and update self-exclusion. The intended shape is equivalent to `t.Name.ToLower() == clean.ToLower()` after trimming, or another explicitly normalized equality expression that does not interpret user input as a pattern.

The list search at `_FetchAllActiveAsync` also uses `ILike` with a deliberately constructed `%query%` pattern. That is appropriate for substring search semantics, but it should remain separate from the exact duplicate-name conflict check. It is not the blocker identified above.

#### Transaction and exception handling observation

The delete method catches all exceptions only to roll back the transaction and then rethrows. This does not convert infrastructure failures into domain Results, so the global exception pipeline still receives unexpected failures. It is therefore not a correctness blocker. However, it is a small maintainability concern because the service-level catch/rethrow duplicates transaction cleanup responsibilities and should be reviewed against the project preference for keeping unexpected exception handling in the global pipeline.

## Controller Assessment

`TeachersController` inherits from `AppControllerBase`, uses the `api/teachers` route, binds `TeacherQuery` from query parameters, and delegates service outcomes through `HandleResult`.[7] Create returns `CreatedAtAction` on success and uses `HandleResult` for failures; update, read, and delete use the shared result mapping directly. The declared response statuses cover successful responses and the relevant 400, 404, and 409 outcomes.

| Controller criterion | Result | Assessment |
|---|---:|---|
| Inherits `AppControllerBase` | Pass | Correct base controller is used. |
| Query binding | Pass | `TeacherQuery` is bound with `[FromQuery]`. |
| Thin orchestration | Pass | Controller delegates to the service and does not contain business logic. |
| Standard HTTP mapping | Pass | `HandleResult` is used for domain failures and non-create successes. |
| Create location response | Pass | `CreatedAtAction` points to `GetById`. |

## Frontend Assessment

### API adapter and TanStack Query state

The Teachers API adapter routes list, detail, create, update, and delete calls through the centralized `apiClient` and uses the expected `/teachers` and `/teachers/{id}` paths.[8] The hooks define a stable `teacherKeys` family with `all`, `list`, and `detail` keys. Queries use TanStack Query and forward the query-provided `AbortSignal`; the detail query is correctly gated for positive IDs.[9]

Create, update, and delete use `useMutation`. Each mutation invalidates the feature’s root key, and update additionally seeds the updated detail cache. This matches the established Layer A mutation/cache pattern. No manual `fetch` call, data-fetching `useEffect`, `isMounted` guard, or feature-local network path was found in the Teachers feature or page.

| Frontend criterion | Result | Assessment |
|---|---:|---|
| Centralized API client | Pass | All Teacher requests use `apiClient`. |
| Endpoint paths | Pass | `/teachers` and `/teachers/{id}` match the controller. |
| TanStack Query only | Pass | Queries and mutations are managed by React Query. |
| Query keys | Pass | Stable `all/list/detail` family is present. |
| Abort signals | Pass | Query functions forward `signal`; mutations use the established adapter pattern. |
| Mutation invalidation | Pass | All mutations invalidate `teacherKeys.all`; update refreshes detail cache. |

### Subject dropdown integration

`TeachersPage` calls `useSubjects()` and passes the resulting collection to both the page-level Subject filter and the create/edit modal components.[10] `TeacherModals` maps Subjects into the shared `SearchableSelect`, preserves a `null` Subject assignment through the explicit `none` option, and converts selected values back to numeric IDs.[11] This avoids manual Subject fetching and follows the requested feature integration pattern.

One non-blocking gap is that `TeachersPage` consumes only `data` from `useSubjects()` and does not display a dedicated Subject-query error state or retry path. If the Subject request fails while the teacher request succeeds, the page can still render but the Subject filter and assignment picker will be empty without an explicit localized explanation. This does not block basic Teacher CRUD, but it is a UX and diagnosability improvement recommended before a later polish pass.

### Modal lifecycle and form state

Create, edit, and delete use the shared `EntityCreateModal`, `EntityUpdateModal`, and `EntityDeleteModal` shells, which provide the React Aria form/dialog lifecycle, busy-state close guards, and localized error rendering.[11] The feature owns its local form fields for name, Subject, and supervisor state. The page conditionally mounts each modal only while it is open, so closing and reopening unmounts and reinitializes the local state. The edit modal also receives the selected Teacher only while the edit modal is mounted, preventing stale state across normal selection/reopen flows.[10][11]

The `IsSupervisor` boolean is controlled end-to-end: it is initialized from the Teacher DTO for edit, passed through the shared `ToggleCard`, and included in create/update payloads. No missing flag or incorrect boolean conversion was identified.

The shared `SearchableSelect` used by Teachers schedules focus and highlight updates with `setTimeout` calls that are not cancelled on unmount.[12] This is shared infrastructure rather than Teachers-specific logic. It is a minor cleanup opportunity because a component can unmount before its queued callback executes, although the callbacks use guarded refs and do not create a demonstrated deployment blocker in the Teachers flow.

## Critical Flaws / Blockers

| ID | Severity | Finding | Impact | Required action |
|---|---|---|---|---|
| T-B01 | Critical | `_CheckNameConflictAsync` uses `EF.Functions.ILike` with the raw trimmed name as a pattern. | `%` and `_` are interpreted as SQL wildcards, so duplicate-name conflict decisions are not literal normalized equality. | Replace the exact conflict predicate with normalized, case-insensitive equality while preserving active filtering and update exclusion. |

T-B01 is the only blocker identified from the requested criteria. It is a business-integrity issue in the service layer and should be corrected before merge.

## Minor Improvements

| ID | Severity | Finding | Recommendation |
|---|---|---|---|
| T-M01 | Minor | The page does not surface a separate `useSubjects()` loading/error state. | Add explicit Subject-query error handling or disable Subject-dependent controls with a localized explanation and retry path. |
| T-M02 | Minor | The shared `SearchableSelect` schedules uncancelled zero/50 ms timers. | Store timer handles and clear them in effect cleanup, or replace the timing workaround with a lifecycle-safe focus/reset approach. |
| T-M03 | Minor | Teacher list filtering is performed client-side after loading the full active list. | Consider server-side query parameters if teacher volume grows; this is an optimization rather than a current correctness issue. |
| T-M04 | Minor | The service transaction catch/rethrow is more verbose than necessary. | Review whether the transaction API can provide automatic rollback on disposal while leaving unexpected exceptions to the global handler. |

## Verification Results

The permitted non-mutating checks produced the following results:

| Check | Result | Notes |
|---|---:|---|
| Frontend production build | Passed | Vite completed successfully; it emitted the existing large-chunk advisory only. |
| Frontend lint | Passed | ESLint completed without reported errors. |
| Backend Release build | Passed | `/home/ubuntu/.dotnet/dotnet build ... -warnaserror` completed with 0 warnings and 0 errors. |
| Automated tests | Not run | Explicitly out of scope. |
| `dotnet ef database update` | Not run | Explicitly prohibited. |
| Working-tree mutation by audit | None | Existing unrelated working-tree modifications remained unchanged; no audit source changes were introduced. |

## Final Verdict

> **[NEEDS FIXES BEFORE MERGE]**

The Teachers slice is structurally close to production-ready. Its data model, Subject relationship, transactional soft-delete behavior, Result pattern, controller mapping, API adapter, TanStack Query hooks, Subject picker integration, and modal lifecycle are aligned with the project rules. The unsafe exact-name `ILike` predicate is nevertheless a direct violation of the required query-safety invariant and can produce incorrect uniqueness behavior for valid user input. Correcting T-B01 is required before merge; T-M01 through T-M04 can be addressed as follow-up improvements.

## References

[1]: file:///home/ubuntu/TeacherSubApp_V3/TeacherSubApp.Api/Data/1.Models/B.1_Teacher.cs "Teacher entity"

[2]: file:///home/ubuntu/TeacherSubApp_V3/TeacherSubApp.Api/Data/2.Configs/A.1_SubjectConfig.cs "Subject EF configuration"

[3]: file:///home/ubuntu/TeacherSubApp_V3/TeacherSubApp.Api/Migrations/AppDbContextModelSnapshot.cs "EF Core model snapshot"

[4]: file:///home/ubuntu/TeacherSubApp_V3/TeacherSubApp.Api/Features/B.1_Teachers/3.TeacherService.cs "Teacher service"

[5]: file:///home/ubuntu/TeacherSubApp_V3/TeacherSubApp.Api/Features/B.1_Teachers/Dtos/TeacherWriteDto.cs "Teacher write DTO"

[6]: file:///home/ubuntu/TeacherSubApp_V3/TeacherSubApp.Api/Features/B.1_Teachers/2.TeacherErrors.cs "Teacher domain errors"

[7]: file:///home/ubuntu/TeacherSubApp_V3/TeacherSubApp.Api/Features/B.1_Teachers/4.TeachersController.cs "Teachers controller"

[8]: file:///home/ubuntu/TeacherSubApp_V3/TeacherSubApp.UI/src/features/teachers/api.ts "Teachers API adapter"

[9]: file:///home/ubuntu/TeacherSubApp_V3/TeacherSubApp.UI/src/features/teachers/hooks.ts "Teachers TanStack Query hooks"

[10]: file:///home/ubuntu/TeacherSubApp_V3/TeacherSubApp.UI/src/pages/TeachersPage.tsx "Teachers page"

[11]: file:///home/ubuntu/TeacherSubApp_V3/TeacherSubApp.UI/src/features/teachers/components/TeacherModals.tsx "Teacher modals"

[12]: file:///home/ubuntu/TeacherSubApp_V3/TeacherSubApp.UI/src/components/controls/SearchableSelect.tsx "Shared searchable select"
