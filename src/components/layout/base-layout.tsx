import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  PenSquare,
  FileText,
  BarChart3,
  Settings,
  Menu,
} from "lucide-react";
import { cn } from "@lib/utils";

/* -------------------------------------------------------------------------------------------------- */

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Write", href: "/write", icon: PenSquare },
  { name: "Content", href: "/content", icon: FileText },
  { name: "Measure", href: "/measure", icon: BarChart3 },
];

export default function BaseLayout() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300",
          isCollapsed ? "w-16" : "w-60",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6 justify-between">
            <div className="flex items-center">
              <PenSquare
                className={cn(
                  "h-6 w-6 text-primary transition-all",
                  isCollapsed ? "mr-0" : "mr-2",
                )}
              />

              {!isCollapsed && (
                <span className="font-semibold text-lg">Writer</span>
              )}
            </div>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    isCollapsed && "justify-center",
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && item.name}
                </Link>
              );
            })}
          </nav>

          {/* Settings */}
          <div className="border-t p-3">
            <Link
              to="/"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                location.pathname === "/settings"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                isCollapsed && "justify-center",
              )}
              title={isCollapsed ? "Settings" : undefined}
            >
              <Settings className="h-5 w-5 shrink-0" />
              {!isCollapsed && "Settings"}
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          "min-h-screen transition-all duration-300",
          isCollapsed ? "pl-16" : "pl-64",
        )}
      >
        <div className="container mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
