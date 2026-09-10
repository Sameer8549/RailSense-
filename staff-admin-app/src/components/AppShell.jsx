import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, ListChecks, Ship, Activity, Train, BarChart2,
  LogOut, Sun, Moon, Monitor, Menu, X, Search,
  PanelLeftClose, PanelLeftOpen, User, ShieldCheck,
} from "lucide-react";
import { useStaffStore } from "@/store/staffStore.js";
import { cn } from "@/lib/utils.js";

const TTE_NAV = [
  { to: "/queue",    icon: ListChecks, label: "Incident Queue" },
  { to: "/activity", icon: Activity,   label: "My Activity" },
];
const ADMIN_NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/queue",     icon: ListChecks,      label: "Incident Queue" },
  { to: "/fleet",     icon: Ship,            label: "Fleet Overview" },
  { to: "/analytics", icon: BarChart2,        label: "Analytics" },
];

// ─── Sidebar NavItem ──────────────────────────────────────────────
function NavItem({ to, icon: Icon, label, collapsed }) {
  return (
    <NavLink to={to} title={label}
      className={({ isActive }) => cn(
        "relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-300",
        "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
        isActive && "text-primary font-bold bg-primary/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]",
        collapsed ? "justify-center p-3" : "px-4 py-3"
      )}
    >
      {({ isActive }) => (
        <>
          <Icon className={cn("w-5 h-5 shrink-0 transition-colors duration-300", isActive ? "text-primary" : "text-sidebar-foreground/50")} />
          {!collapsed && <span className="truncate">{label}</span>}
          {isActive && !collapsed && (
            <motion.div layoutId="nav-indicator" className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
          )}
        </>
      )}
    </NavLink>
  );
}

// ─── Sidebar action button ────────────────────────────────────────
function SidebarBtn({ icon: Icon, label, onClick, collapsed, danger }) {
  return (
    <button type="button" onClick={onClick} title={label}
      className={cn(
        "w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
        danger
          ? "text-red-400/80 hover:text-red-400 hover:bg-red-500/10"
          : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
        collapsed ? "justify-center p-3" : "px-4 py-3"
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}

// ─── Sidebar content (shared desktop + mobile) ───────────────────
function SidebarContent({ collapsed, setCollapsed, isMobile, onClose }) {
  const navigate = useNavigate();
  const session = useStaffStore((s) => s.session);
  const logout = useStaffStore((s) => s.logout);
  const theme = useStaffStore((s) => s.theme);
  const setTheme = useStaffStore((s) => s.setTheme);

  const nav = session?.role === "admin" ? ADMIN_NAV : TTE_NAV;
  const roleLabel = session?.role === "admin" ? "Admin" : "TTE";
  const RoleIcon = session?.role === "admin" ? ShieldCheck : User;

  const THEME_CYCLE = { light: "dark", dark: "system", system: "light" };
  const THEME_ICON  = { light: Sun, dark: Moon, system: Monitor };
  const THEME_LABEL = { light: "Light mode", dark: "Dark mode", system: "System" };
  const ThemeIcon = THEME_ICON[theme] ?? Monitor;
  const nextTheme = THEME_CYCLE[theme] ?? "light";

  const handleLogout = () => { logout(); navigate("/", { replace: true }); };

  return (
    <div className="flex flex-col h-full bg-sidebar/80 backdrop-blur-2xl">
      {/* ── Logo header ─────────────────────────────────────────── */}
      <div className={cn(
        "h-16 flex items-center border-b border-sidebar-border/50 shrink-0 px-4 gap-3",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {/* Brand mark — always visible */}
        <div className={cn("flex items-center gap-3 min-w-0", collapsed && "justify-center")}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-border">
            <div className="w-7 h-7 bg-sidebar-foreground" style={{ maskImage: "url(/app/staff/logo.png)", WebkitMaskImage: "url(/app/staff/logo.png)", maskSize: "contain", WebkitMaskSize: "contain", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskPosition: "center", WebkitMaskPosition: "center" }} />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex flex-col justify-center">
              <div className="text-base font-extrabold font-display text-sidebar-foreground leading-none tracking-tight">RailSense</div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-primary mt-0.5 leading-none">Staff Portal</div>
            </div>
          )}
        </div>

        {/* Desktop collapse toggle — only when expanded */}
        {!collapsed && !isMobile && (
          <button type="button" onClick={() => setCollapsed(true)}
            title="Collapse sidebar"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors shrink-0">
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
        {/* Mobile close */}
        {isMobile && (
          <button type="button" onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── Expand button when collapsed ────────────────────────── */}
      {collapsed && !isMobile && (
        <button type="button" onClick={() => setCollapsed(false)} title="Expand sidebar"
          className="flex items-center justify-center py-3 border-b border-sidebar-border/50 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors shrink-0">
          <PanelLeftOpen className="w-5 h-5" />
        </button>
      )}

      {/* ── Navigation ───────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40 px-4 mb-2">
          {!collapsed && "Main Menu"}
        </div>
        {nav.map(item => <NavItem key={item.to} {...item} collapsed={collapsed} />)}
      </nav>

      {/* ── Bottom user chip & actions ──────────────────────────────── */}
      <div className="p-3 border-t border-sidebar-border/50 shrink-0 bg-sidebar/40">
        <div className="space-y-1 mb-3">
          <SidebarBtn icon={ThemeIcon} label={THEME_LABEL[theme] ?? "Theme"} onClick={() => setTheme(nextTheme)} collapsed={collapsed} />
          <SidebarBtn icon={LogOut} label="Log out" onClick={handleLogout} collapsed={collapsed} danger />
        </div>

        {session && (
          <div className={cn(
            "rounded-xl bg-black/10 dark:bg-black/20 border border-border",
            collapsed ? "flex justify-center p-2" : "p-3"
          )}>
            {collapsed ? (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center" title={`${session.name} · ${roleLabel}`}>
                <RoleIcon className="w-4 h-4 text-primary" />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sidebar-accent to-background flex items-center justify-center shrink-0 border border-border">
                  <RoleIcon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold font-display text-sidebar-foreground truncate">{session.name}</div>
                  <div className="text-[11px] text-sidebar-foreground/50 font-medium">{session.id} · {roleLabel}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AppShell ─────────────────────────────────────────────────────
export function AppShell({ children, onCommandOpen }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const session = useStaffStore((s) => s.session);
  const liveStatus = useStaffStore((s) => s.liveStatus);
  const lastUpdatedAt = useStaffStore((s) => s.lastUpdatedAt);
  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) return "Sync pending";
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(lastUpdatedAt).getTime()) / 1000));
    if (seconds < 5) return "Updated now";
    if (seconds < 60) return `Updated ${seconds}s ago`;
    return `Updated ${Math.floor(seconds / 60)}m ago`;
  }, [lastUpdatedAt]);

  return (
    <div className="flex h-screen overflow-hidden bg-background selection:bg-primary/30">
      
      {/* Background ambient glow effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-500/5 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 260 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="hidden md:flex flex-col border-r border-border shrink-0 overflow-hidden relative z-40 bg-sidebar shadow-2xl"
      >
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} isMobile={false} />
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div key="overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside key="mobile-sidebar"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 border-r border-border flex flex-col md:hidden shadow-2xl bg-sidebar"
            >
              <SidebarContent collapsed={false} setCollapsed={() => {}} isMobile onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Top bar */}
        <header className="h-16 flex items-center px-6 gap-4 border-b border-border bg-background/50 backdrop-blur-xl shrink-0 z-30 relative shadow-sm">
          {/* Mobile menu toggle */}
          <button type="button" onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted transition-colors border border-border">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex-1" />

          <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <span className={cn("h-2 w-2 rounded-full", liveStatus === "error" ? "bg-red-500" : "bg-green-500")} />
            {lastUpdatedLabel}
          </div>

          {/* Command palette trigger */}
          <button type="button" onClick={onCommandOpen}
            className="hidden sm:flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-black/5 hover:bg-card hover:bg-muted transition-all w-64 justify-between shadow-inner">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Search className="w-4 h-4" />
              <span className="text-sm font-medium">Search or run action…</span>
            </div>
            <kbd className="inline-flex items-center rounded-md border border-border bg-background/50 px-2 py-0.5 font-mono text-[10px] font-bold text-muted-foreground shadow-sm">
              ⌘K
            </kbd>
          </button>
          <button type="button" onClick={onCommandOpen}
            className="sm:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted transition-colors border border-border">
            <Search className="w-5 h-5" />
          </button>

          {/* Session badge */}
          {session && (
            <div className="hidden sm:flex items-center gap-2 px-3 h-10 rounded-xl border border-border bg-muted text-sm font-bold font-display shadow-sm">
              <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
                {session.role === "admin" ? <ShieldCheck className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5 text-primary" />}
              </div>
              {session.name}
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}

