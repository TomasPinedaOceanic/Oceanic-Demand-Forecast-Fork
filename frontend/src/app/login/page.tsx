"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Activity, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard")
    }
  }, [isAuthenticated, isLoading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const success = await login(email, password)
      if (success) {
        router.replace("/dashboard")
      } else {
        setError("Credenciales invalidas. Intente de nuevo.")
      }
    } catch {
      setError("Error al iniciar sesion. Intente de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-2xl shadow-xl">
        {/* Left Panel - Branding */}
        <div className="hidden w-1/2 flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/20">
                <Activity className="h-6 w-6" />
              </div>
              <span className="text-xl font-semibold tracking-tight">Oceanic Predict</span>
            </div>
          </div>
          <div>
            <h1 className="mb-4 text-3xl font-bold leading-tight text-balance">
              Transforma tus datos operativos en decisiones estrategicas
            </h1>
            <p className="text-base leading-relaxed text-primary-foreground/80">
              Plataforma de analitica avanzada para PYMES. Prediccion de demanda, optimizacion de inventarios y proyeccion de flujo de caja impulsados por Machine Learning.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20 text-sm font-semibold">
                1
              </div>
              <span className="text-sm text-primary-foreground/80">Carga tus datos historicos de ventas e inventarios</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20 text-sm font-semibold">
                2
              </div>
              <span className="text-sm text-primary-foreground/80">Nuestro motor predictivo analiza patrones y tendencias</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20 text-sm font-semibold">
                3
              </div>
              <span className="text-sm text-primary-foreground/80">Obtiene proyecciones precisas para optimizar tu negocio</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex w-full flex-col justify-center bg-card p-8 lg:w-1/2 lg:p-12">
          <div className="mx-auto w-full max-w-sm">
            {/* Mobile Logo */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Activity className="h-6 w-6" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-foreground">Oceanic Predict</span>
            </div>

            <Card className="border-0 shadow-none">
              <CardHeader className="px-0">
                <CardTitle className="text-2xl font-bold text-foreground">Iniciar Sesion</CardTitle>
                <CardDescription>
                  Ingrese sus credenciales para acceder al panel de control
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  {error && (
                    <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email" className="text-foreground">Correo Electronico</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="password" className="text-foreground">Contrasena</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Ingrese su contrasena"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="mt-2 w-full"
                  >
                    {loading ? "Ingresando..." : "Ingresar"}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    Demo: Ingrese cualquier correo y contrasena de 4+ caracteres
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
