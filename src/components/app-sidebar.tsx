"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  LayoutDashboard,
  Upload,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Activity,
  Package,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/data-ingestion", label: "Ingesta de Datos", icon: Upload },
  { href: "/inventory", label: "Inventario", icon: Package },
  { href: "/dashboard", label: "Predicciones", icon: BarChart3, disabled: true },
  { href: "/dashboard", label: "Configuracion", icon: Settings, disabled: true },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "flex h-screen flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-[68px]" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Activity className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              Oceanic Predict
            </span>
            <span className="text-xs text-sidebar-foreground/60">Analytics MVP</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.label}>
                {item.disabled ? (
                  <span
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/40 cursor-not-allowed",
                      collapsed && "justify-center px-0",
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && (
                      <span className="ml-auto text-[10px] font-normal uppercase tracking-wider text-sidebar-foreground/30">
                        Pronto
                      </span>
                    )}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                      collapsed && "justify-center px-0",
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border px-3 py-4">
        {!collapsed && user && (
          <div className="mb-3 flex items-center gap-3 px-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/20 text-sm font-semibold text-sidebar-primary">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">{user.name}</span>
              <span className="text-xs text-sidebar-foreground/50">{user.role}</span>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className={cn(
              "justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Cerrar Sesion</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronLeft className="h-4 w-4 shrink-0" />
            )}
            {!collapsed && <span>Colapsar</span>}
          </Button>
        </div>
      </div>
    </aside>
  )
}
