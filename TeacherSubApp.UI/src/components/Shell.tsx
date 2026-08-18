import { useState, useCallback } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Bell,
  Users,
  BookOpen,
  School,
  CalendarClock,
  Settings,
  ChevronDown,
  LayoutPanelTop,
} from "lucide-react";
import schoolLogo from "../assets/logo.png";

// ─────────────────────────────────────────────────────────────
// [SECTION 1] — NAVIGATION CONFIG
// ─────────────────────────────────────────────────────────────

// ── Interfaces ───────────────────────────────────────────

interface NavLinkConfig {
  label: string;
  path: string;
  Icon: LucideIcon;
}

interface CollapseGroupConfig {
  label: string;
  Icon: LucideIcon;
  links: NavLinkConfig[];
}

// ── Main Pages  ─────────────────────────────────────────

const MAIN_LINKS: NavLinkConfig[] = [
  { label: "لوحة التحكم", path: "/dashboard", Icon: LayoutDashboard },
  { label: "جدول الحصص", path: "/schedule", Icon: CalendarDays },
  { label: "طلبات الغياب", path: "/absences", Icon: ClipboardList },
  { label: "الإشعارات", path: "/notifications", Icon: Bell },
];

// ── Collapse Menus ──────────────────────────────────────

const RESOURCES_LINKS: NavLinkConfig[] = [
  { label: "المعلمون", path: "/resources/teachers", Icon: Users },
  { label: "الفصول", path: "/resources/classes", Icon: School },
  { label: "المواد", path: "/resources/subjects", Icon: BookOpen },
  { label: "الأحداث", path: "/resources/events", Icon: CalendarClock },
];

const COLLAPSE_GROUPS: CollapseGroupConfig[] = [
  {
    label: "إدارة الموارد",
    Icon: LayoutPanelTop,
    links: RESOURCES_LINKS,
  },
];

// ── Secondry Pages ────────────────────────────────────

const SECONDARY_LINKS: NavLinkConfig[] = [
  { label: "الإعدادات", path: "/settings", Icon: Settings },
];

// ─────────────────────────────────────────────────────────────
// [SECTION 2] — DESIGN TOKENS + SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

// ── Design Tokens ─────────────────────────────────────────────

const STYLES = {
  // The app shell
  shell: "flex h-screen bg-neutral-50 text-neutral-900 overflow-hidden",

  // Sidebar panel
  sidebar:
    "flex flex-col w-64 shrink-0 m-3 me-0 p-3 bg-white border border-neutral-200/60 rounded-3xl overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",

  // School header card at the top of the sidebar
  schoolCard:
    "flex items-center justify-between gap-9 px-3 py-4 mb-2 bg-neutral-100 rounded-2xl",
  schoolName: "text-sm font-semibold tracking-tight text-black truncate mb-1",
  schoolSub: "text-xs text-neutral-700 truncate",
  schoolLogo:
    "shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-blue-500/10 border border-neutral-200/60 overflow-hidden",

  // Separator between main and resource links
  separator: "my-3 border-neutral-200/60",

  // Main content area
  workspace:
    "flex-1 flex flex-col m-3 rounded-3xl bg-neutral-100/50 border border-neutral-200/60 overflow-y-auto",

  // Nav row — shared by NavItem and CollapseGroup
  navRow: {
    base: "flex items-center gap-3 w-full min-h-[44px] px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]",
    active: "bg-blue-500/10 text-blue-500",
    idle: "text-neutral-800 hover:bg-neutral-100 hover:text-black",
    subIndent: "ps-5 font-normal",
  },

  // Chevron inside CollapseGroup
  chevron: {
    base: "shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]",
    open: "rotate-180",
    closed: "rotate-0",
  },

  // Collapse panel animation
  collapsePanel: {
    base: "overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]",
    open: "max-h-96 opacity-100",
    closed: "max-h-0 opacity-0",
  },
};

// ── NavItem ──────────────────────────────────────────────────

function NavItem({
  link,
  isSubItem = false,
}: {
  link: NavLinkConfig;
  isSubItem?: boolean;
}) {
  const { Icon, label, path } = link;
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        [
          STYLES.navRow.base,
          isActive ? STYLES.navRow.active : STYLES.navRow.idle,
          isSubItem ? STYLES.navRow.subIndent : "",
        ].join(" ")
      }
    >
      <Icon
        size={18}
        strokeWidth={1.75}
        className="shrink-0"
        aria-hidden="true"
      />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

// ── CollapseGroup ─────────────────────────────────────────────

function CollapseGroup({
  label,
  Icon,
  links,
}: {
  label: string;
  Icon: LucideIcon;
  links: NavLinkConfig[];
}) {
  const location = useLocation();
  const isAnyChildActive = links.some((l) =>
    location.pathname.startsWith(l.path),
  );
  const [open, setOpen] = useState<boolean>(isAnyChildActive);
  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className={[
          STYLES.navRow.base,
          isAnyChildActive ? STYLES.navRow.active : STYLES.navRow.idle,
        ].join(" ")}
      >
        <Icon
          size={18}
          strokeWidth={1.75}
          className="shrink-0"
          aria-hidden="true"
        />
        <span className="flex-1 truncate text-start">{label}</span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={[
            STYLES.chevron.base,
            open ? STYLES.chevron.open : STYLES.chevron.closed,
          ].join(" ")}
          aria-hidden="true"
        />
      </button>

      <div
        className={[
          STYLES.collapsePanel.base,
          open ? STYLES.collapsePanel.open : STYLES.collapsePanel.closed,
        ].join(" ")}
      >
        <div className="mt-1 flex flex-col gap-0.5 ps-2">
          {links.map((link) => (
            <NavItem key={link.path} link={link} isSubItem />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// [SECTION 3] — LAYOUT
// ─────────────────────────────────────────────────────────────

export default function Layout() {
  return (
    <div className={STYLES.shell}>
      {/* ── SIDEBAR ── */}
      <aside className={STYLES.sidebar}>
        {/* School header */}
        <div className={STYLES.schoolCard}>
          <div className="flex flex-col min-w-0">
            <span className={STYLES.schoolName}>مدرسة الفرقان الأهلية</span>
            <span className={STYLES.schoolSub}>إدارة الإحتياط والحصص</span>
          </div>
          <div className={STYLES.schoolLogo}>
            <img
              src={schoolLogo}
              alt="شعار المدرسة"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Main nav */}
        <nav>
          <div className="flex flex-col gap-0.5">
            {MAIN_LINKS.map((link) => (
              <NavItem key={link.path} link={link} />
            ))}
          </div>
        </nav>

        {/* Separator */}
        <hr className={STYLES.separator} />

        {/* Collapsible resources */}
        <nav>
          <div className="flex flex-col gap-0.5">
            {COLLAPSE_GROUPS.map((group) => (
              <CollapseGroup key={group.label} {...group} />
            ))}
          </div>
        </nav>

        {/* Push settings to the bottom */}
        <div className="flex-1" />

        {/* Secondary links */}
        <nav>
          <div className="flex flex-col gap-0.5">
            {SECONDARY_LINKS.map((link) => (
              <NavItem key={link.path} link={link} />
            ))}
          </div>
        </nav>
      </aside>

      {/* ── WORKSPACE ── */}
      <main className={STYLES.workspace}>
        <Outlet />
      </main>
    </div>
  );
}
