import type { ReactNode } from "react";
import { AlertCircle, RefreshCw, Plus } from "lucide-react";
import { Button } from "../controls/Button";
import { getErrorMessage } from "../../lib/apiErrors";

const STYLES = {
  headerRow: "flex flex-col sm:flex-row sm:items-start justify-between gap-4",
  headerText: "flex flex-col gap-1",
  title: "text-2xl font-bold tracking-tight text-neutral-900",
  subtitle: "text-sm text-neutral-500 font-medium",
  description: "text-sm text-neutral-500 leading-relaxed max-w-2xl mt-1",

  errorBanner:
    "flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 shadow-sm",
  errorMessage: "font-medium flex-1",
  errorRetryButton:
    "flex items-center gap-1.5 px-4 py-2 ms-auto text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-full hover:bg-neutral-50 transition-all disabled:opacity-50 shadow-sm",

  toolbar: "flex flex-wrap items-center gap-3",
};

// ════════════════════════════════════════════════════════════
// 1. EntityPageHeader — title + subtitle + description + add button
// ════════════════════════════════════════════════════════════
// Usage:
//   <EntityPageHeader
//     title="المواد الدراسية"
//     subtitle="12 مادة مسجلة"
//     description="..."
//     addLabel="إضافة مادة"
//     onAdd={() => setCreateOpen(true)}
//     isDisabled={isLoading}
//   />
// ════════════════════════════════════════════════════════════

interface EntityPageHeaderProps {
  title: string;
  description: string;
  addLabel: string;
  onAdd: () => void;
  isDisabled?: boolean;
}

export function EntityPageHeader({
  title,
  description,
  addLabel,
  onAdd,
  isDisabled = false,
}: EntityPageHeaderProps) {
  return (
    <div className={STYLES.headerRow}>
      <div className={STYLES.headerText}>
        <h1 className={STYLES.title}>{title}</h1>
        <p className={STYLES.description}>{description}</p>
      </div>

      <Button variant="primary" onPress={onAdd} isDisabled={isDisabled}>
        <Plus size={18} strokeWidth={2.5} />
        {addLabel}
      </Button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 2. EntityPageHeaderPlain — title + subtitle + description, no main action button.
// ════════════════════════════════════════════════════════════
// Usage:
//   <EntityPageHeaderPlain
//     title="لوحة التحكم"
//     subtitle="نظرة عامة على اليوم"
//     description="..."
//   />
// ════════════════════════════════════════════════════════════

interface EntityPageHeaderPlainProps {
  title: string;
  subtitle: string;
  description: string;
}

export function EntityPageHeaderPlain({
  title,
  subtitle,
  description,
}: EntityPageHeaderPlainProps) {
  return (
    <div className={STYLES.headerText}>
      <h1 className={STYLES.title}>{title}</h1>
      <p className={STYLES.subtitle}>{subtitle}</p>
      <p className={STYLES.description}>{description}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 3. EntityErrorBanner — shown when the data fetch fails
// ════════════════════════════════════════════════════════════
// Usage:
//   <EntityErrorBanner error={error} onRetry={refetch} isRetrying={isLoading} />
// ════════════════════════════════════════════════════════════

interface EntityErrorBannerProps {
  error: unknown;
  onRetry: () => void;
  isRetrying: boolean;
}

export function EntityErrorBanner({
  error,
  onRetry,
  isRetrying,
}: EntityErrorBannerProps) {
  return (
    <div role="alert" className={STYLES.errorBanner}>
      <AlertCircle size={18} strokeWidth={2} className="shrink-0" />
      <span className={STYLES.errorMessage}>{getErrorMessage(error)}</span>
      <Button
        variant="quiet"
        onPress={onRetry}
        isDisabled={isRetrying}
        className={STYLES.errorRetryButton}
      >
        <RefreshCw size={14} className={isRetrying ? "animate-spin" : ""} />
        إعادة المحاولة
      </Button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 4. EntityToolbar — layout wrapper for the search/sort/filter row.
// ════════════════════════════════════════════════════════════
// Usage:
//   <EntityToolbar>
//     <SearchInput ... />
//     <SortToggle ... />
//     {hasFilters && (
//       <Button variant="quiet" onPress={onClearFilters}>
//         <X size={16} strokeWidth={2.5} />
//         إلغاء التصفية
//       </Button>
//     )}
//   </EntityToolbar>
// ════════════════════════════════════════════════════════════

export function EntityToolbar({ children }: { children: ReactNode }) {
  return <div className={STYLES.toolbar}>{children}</div>;
}
