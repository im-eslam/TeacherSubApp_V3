import { useState, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import { X } from "lucide-react";
import { useDelayedLoading } from "../lib/useDelayedLoading";
import {
  EntityPageHeader,
  EntityErrorBanner,
  EntityToolbar,
} from "../components/layout/EntityPageLayout";
import { SearchInput } from "../components/controls/SearchInput";
import { SortToggle, type SortOrder } from "../components/controls/SortToggle";
import { Button } from "../components/controls/Button";
import {
  useEventKeys,
  useCreateEventKey,
  useUpdateEventKey,
  useDeleteEventKey,
} from "../features/events/hooks";
import { EventKeyGrid } from "../features/events/components/EventGrid";
import {
  EventKeyCreateModal,
  EventKeyEditModal,
  EventKeyDeleteModal,
} from "../features/events/components/EventModals";
import type {
  EventKeyReadDto,
  EventKeyWriteDto,
} from "../features/events/types";
import { useDebouncedValue } from "../lib/useDebouncedValue";

export default function EventKeysPage() {
  // ── Data fetching ──
  const {
    data: eventKeys = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useEventKeys();
  const createMutation = useCreateEventKey();
  const updateMutation = useUpdateEventKey();
  const deleteMutation = useDeleteEventKey();

  // ── Modal state ──
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedEventKey, setSelectedEventKey] =
    useState<EventKeyReadDto | null>(null);

  // ── Toolbar state ──
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // ── Derived data ──
  const displayedEventKeys = useMemo(() => {
    const filtered = debouncedQuery.trim()
      ? eventKeys.filter((e) =>
          e.eventName
            .toLowerCase()
            .includes(debouncedQuery.trim().toLowerCase()),
        )
      : [...eventKeys];

    return filtered.sort((a, b) =>
      sortOrder === "asc"
        ? a.eventName.localeCompare(b.eventName, "ar")
        : b.eventName.localeCompare(a.eventName, "ar"),
    );
  }, [eventKeys, debouncedQuery, sortOrder]);

  const hasFilters = query.length > 0 || sortOrder !== "asc";
  const showLoader = useDelayedLoading(isLoading, 200);
  const isAwaitingData = isLoading && eventKeys.length === 0;

  const isDisabled = isLoading;

  // ── Handlers ──
  const handleCreateSubmit = async (data: EventKeyWriteDto) => {
    await createMutation.mutateAsync(data);
    toast.success("تمت إضافة الحدث بنجاح");
  };

  const handleEditSubmit = async (id: number, data: EventKeyWriteDto) => {
    await updateMutation.mutateAsync({ id, dto: data });
    toast.success("تم حفظ التعديلات");
  };

  const handleDeleteSubmit = async (id: number) => {
    await deleteMutation.mutateAsync(id);
    toast.success("تم حذف الحدث");
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full">
      <Toaster
        position="top-center"
        toastOptions={{
          className: "font-medium text-sm",
          style: { direction: "rtl", borderRadius: "50px" },
        }}
      />

      <EntityPageHeader
        title="الأحداث"
        description="تمثل الحصص غير الدراسية كالاجتماعات. يمكن تخصيص حدث كـ«دعم» لدخول معلمَين معاً للحصة، أو كـ«احتياطي» لمنح صاحبه الأولوية عند اختياره كبديل لتغطية الغياب."
        addLabel="إضافة حدث"
        onAdd={() => {
          setCreateOpen(true);
        }}
        isDisabled={isDisabled}
      />

      {isError && (
        <EntityErrorBanner
          error={error}
          onRetry={refetch}
          isRetrying={isLoading}
        />
      )}

      <EntityToolbar>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="بحث عن حدث..."
          isDisabled={isDisabled}
        />

        <SortToggle
          sortOrder={sortOrder}
          onSortToggle={() =>
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
          }
          isDisabled={isDisabled}
          sortAscLabel="أ ← ي"
          sortDescLabel="ي ← أ"
        />

        {hasFilters && (
          <Button
            variant="quiet"
            onPress={() => {
              setQuery("");
              setSortOrder("asc");
            }}
            isDisabled={isDisabled}
          >
            <X size={16} strokeWidth={2.5} />
            إلغاء التصفية
          </Button>
        )}
      </EntityToolbar>

      <EventKeyGrid
        eventKeys={displayedEventKeys}
        isLoading={showLoader}
        isAwaitingData={isAwaitingData}
        isError={isError}
        searchQuery={debouncedQuery}
        onAdd={() => {
          setCreateOpen(true);
        }}
        onEdit={(eventKey) => {
          setSelectedEventKey(eventKey);
          setEditOpen(true);
        }}
        onDelete={(eventKey) => {
          setSelectedEventKey(eventKey);
          setDeleteOpen(true);
        }}
      />

      {createOpen && (
        <EventKeyCreateModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreateSubmit}
        />
      )}

      {editOpen && selectedEventKey && (
        <EventKeyEditModal
          isOpen={editOpen}
          eventKey={selectedEventKey}
          onClose={() => setEditOpen(false)}
          onSubmit={handleEditSubmit}
        />
      )}

      {deleteOpen && selectedEventKey && (
        <EventKeyDeleteModal
          isOpen={deleteOpen}
          eventKey={selectedEventKey}
          onClose={() => setDeleteOpen(false)}
          onSubmit={handleDeleteSubmit}
        />
      )}
    </div>
  );
}
