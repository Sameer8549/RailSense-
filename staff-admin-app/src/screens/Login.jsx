import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Lock, ChevronDown, AlertCircle, Loader2, Shield, Train } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { useStaffStore } from "@/store/staffStore.js";
import { cn } from "@/lib/utils.js";

const DEMO = [
  { id: "ADM-003", pin: "0000", name: "Demo Admin",  role: "Admin", badge: "admin" },
  { id: "TTE-104", pin: "0000", name: "Demo TTE",    role: "TTE",   badge: "tte" },
  { id: "TTE-201", pin: "0000", name: "Demo TTE 2",  role: "TTE",   badge: "tte" },
];

export default function Login() {
  const navigate = useNavigate();
  const login = useStaffStore((s) => s.login);
  const loginStatus = useStaffStore((s) => s.loginStatus);
  const loginError = useStaffStore((s) => s.loginError);
  const session = useStaffStore((s) => s.session);

  const [staffId, setStaffId] = useState("");
  const [pin, setPin] = useState("");
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => {
    if (session) {
      navigate(session.role === "admin" ? "/dashboard" : "/queue", { replace: true });
    }
  }, [session, navigate]);

  const busy = loginStatus === "loading";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!staffId.trim() || !pin.trim()) return;
    await login(staffId.trim(), pin.trim());
  };

  const fillDemo = (d) => { setStaffId(d.id); setPin(d.pin); setDemoOpen(false); };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(var(--sidebar-border) 1px, transparent 1px), linear-gradient(90deg, var(--sidebar-border) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.5 }}
        className="relative w-full max-w-sm"
      >
        {/* Card */}
        <div className="bg-card rounded-xl border border-border shadow-2xl overflow-hidden">
          {/* Header band */}
          <div className="bg-primary px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                <div className="w-5 h-5 bg-white" style={{ maskImage: "url(/logo.png)", WebkitMaskImage: "url(/logo.png)", maskSize: "contain", WebkitMaskSize: "contain", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskPosition: "center", WebkitMaskPosition: "center" }} />
              </div>
              <div>
                <div className="text-white font-bold text-base leading-none">RailSense</div>
                <div className="text-white/70 text-xs mt-0.5">Staff Operations Portal</div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <h1 className="text-lg font-bold tracking-tight">Staff sign in</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Enter your Staff ID and PIN to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="staffId" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Staff ID</Label>
                <Input
                  id="staffId"
                  placeholder="e.g. TTE-104 or ADM-003"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value.toUpperCase())}
                  autoComplete="username"
                  autoFocus
                  disabled={busy}
                  className="font-mono h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pin" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">PIN</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    placeholder="••••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    autoComplete="current-password"
                    disabled={busy}
                    className="pl-9 font-mono tracking-widest h-10"
                  />
                </div>
              </div>

              <AnimatePresence>
                {loginError && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-start gap-2 text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    {loginError}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button type="submit" className="w-full h-10 font-semibold" disabled={busy || !staffId || !pin}>
                {busy ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Verifying…</> : "Sign in"}
              </Button>
            </form>

            {/* Demo creds */}
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setDemoOpen(!demoOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  Demo credentials
                </span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", demoOpen && "rotate-180")} />
              </button>
              <AnimatePresence>
                {demoOpen && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                    className="overflow-hidden">
                    <div className="border-t border-border divide-y divide-border">
                      {DEMO.map((d) => (
                        <button key={d.id} type="button"
                          onClick={() => fillDemo(d)}
                          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                        >
                          <div>
                            <div className="text-xs font-semibold font-mono">{d.id} / {d.pin}</div>
                            <div className="text-[10px] text-muted-foreground">{d.name}</div>
                          </div>
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border",
                            d.badge === "admin"
                              ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-900 "
                              : "bg-muted border-border text-muted-foreground"
                          )}>{d.role}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-sidebar-foreground/40 mt-4">
          RailSense Internal · Authorised use only
        </p>
      </motion.div>
    </div>
  );
}
