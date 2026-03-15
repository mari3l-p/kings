"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, CheckCircle, AlertCircle, FileSpreadsheet, RefreshCw, ChevronRight, Sheet, LogIn } from "lucide-react"
import { supabase } from "@/app/lib/supabase"
import type { User } from "@supabase/supabase-js"

type UploadResult = {
  success: boolean
  sheet?: string
  extracted: number
  updated: number
  notFound: number
  notFoundList: { modelo: string; sabor: string }[]
  error?: string
}

type Step = "idle" | "loadingSheets" | "pickSheet" | "uploading" | "done"

// ── Login screen ──────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (u: User) => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      setError("Correo o contraseña incorrectos")
      setLoading(false)
    } else {
      onLogin(data.user)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white">Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Inicia sesión para continuar</p>
        </div>
        <div className="space-y-3">
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-(--pink-75) text-white placeholder:text-gray-600"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-(--pink-75) text-white placeholder:text-gray-600"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading || !email || !password}
          className="w-full flex justify-center items-center gap-2 bg-(--pink-75) py-4 rounded-2xl font-bold text-white disabled:opacity-40 transition-all active:scale-95"
        >
          {loading ? <RefreshCw size={18} className="animate-spin" /> : <LogIn size={18} />}
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function UploadInventory() {
  const [user, setUser] = useState<User | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [step, setStep] = useState<Step>("idle")
  const [sheets, setSheets] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [showNotFound, setShowNotFound] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Auth check on mount
  useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setUser(data.session?.user ?? null)
    setCheckingAuth(false)
  })
}, [])

  // ── Show blank while checking, then login if no user
  if (checkingAuth) return <div className="bg-black min-h-screen" />
  if (!user) return <LoginScreen onLogin={setUser} />

  async function getToken(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? ""
  } catch {
    return ""
  }
}

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setCurrentFile(file)
    setResult(null)
    setShowNotFound(false)
    setSelectedSheet(null)
    setStep("loadingSheets")

    const formData = new FormData()
    formData.append("file", file)
    formData.append("getSheets", "true")

    try {
      const token = await getToken()
      const res = await fetch("/api/inventory/upload", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()

      if (data.sheets?.length === 1) {
        setSelectedSheet(data.sheets[0])
        await uploadWithSheet(file, data.sheets[0])
      } else {
        setSheets(data.sheets ?? [])
        setStep("pickSheet")
      }
    } catch {
      setStep("idle")
    } finally {
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function uploadWithSheet(file: File, sheet: string) {
    setStep("uploading")
    const formData = new FormData()
    formData.append("file", file)
    formData.append("sheetName", sheet)

    try {
      const token = await getToken()
      const res = await fetch("/api/inventory/upload", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ success: false, error: "Error de conexión", extracted: 0, updated: 0, notFound: 0, notFoundList: [] })
    } finally {
      setStep("done")
    }
  }

  function reset() {
    setStep("idle")
    setSheets([])
    setSelectedSheet(null)
    setCurrentFile(null)
    setResult(null)
    setShowNotFound(false)
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Actualizar Inventario</h2>
        <p className="text-gray-400 text-sm">Sube el Excel de stock y se actualizará automáticamente.</p>
      </div>

      {(step === "idle" || step === "done") && (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-white/15 rounded-2xl p-10 text-center cursor-pointer transition-all hover:border-(--pink-75)/60 hover:bg-white/3"
        >
          <input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={handleFileSelect} />
          <div className="flex flex-col items-center gap-3">
            <FileSpreadsheet size={36} className="text-gray-500" />
            <div>
              <p className="text-white font-medium">
                {step === "done" ? "Subir otro archivo" : "Selecciona el Excel de stock"}
              </p>
              <p className="text-gray-500 text-xs mt-1">Solo archivos .xlsx</p>
            </div>
            <div className="flex items-center gap-2 bg-(--pink-75) text-white text-sm font-bold px-5 py-2 rounded-xl">
              <Upload size={16} /> Seleccionar archivo
            </div>
          </div>
        </div>
      )}

      {step === "loadingSheets" && (
        <div className="border-2 border-dashed border-white/15 rounded-2xl p-10 text-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={36} className="text-(--pink-75) animate-spin" />
            <p className="text-white font-medium">Leyendo {currentFile?.name}...</p>
          </div>
        </div>
      )}

      {step === "pickSheet" && (
        <div className="border-2 border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold">
            <Sheet size={18} className="text-(--pink-75)" />
            Este archivo tiene {sheets.length} hojas — ¿cuál quieres usar?
          </div>
          <p className="text-gray-500 text-xs">{currentFile?.name}</p>
          <div className="space-y-2">
            {sheets.map((sheet) => (
              <button
                key={sheet}
                onClick={() => {
                  setSelectedSheet(sheet)
                  uploadWithSheet(currentFile!, sheet)
                }}
                className="w-full flex justify-between items-center px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:border-(--pink-75)/60 hover:bg-white/8 text-left transition-all"
              >
                <span className="text-white font-medium">{sheet}</span>
                <ChevronRight size={16} className="text-gray-500" />
              </button>
            ))}
          </div>
          <button onClick={reset} className="text-gray-500 text-xs hover:text-white">Cancelar</button>
        </div>
      )}

      {step === "uploading" && (
        <div className="border-2 border-dashed border-white/15 rounded-2xl p-10 text-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={36} className="text-(--pink-75) animate-spin" />
            <p className="text-white font-medium">Actualizando inventario...</p>
            <p className="text-gray-500 text-xs">Hoja: {selectedSheet}</p>
          </div>
        </div>
      )}

      {step === "done" && result && (
        <div className={`rounded-2xl border p-5 space-y-4 ${result.success ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
          {result.success ? (
            <>
              <div className="flex items-center gap-2 text-green-400 font-bold">
                <CheckCircle size={20} />
                Inventario actualizado — hoja &ldquo;{result.sheet}&rdquo;
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-white">{result.extracted}</p>
                  <p className="text-xs text-gray-400 mt-1">Leídos del Excel</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-green-400">{result.updated}</p>
                  <p className="text-xs text-gray-400 mt-1">Actualizados</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className={`text-2xl font-black ${result.notFound > 0 ? "text-yellow-400" : "text-white"}`}>
                    {result.notFound}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">No encontrados</p>
                </div>
              </div>
              {result.notFound > 0 && (
                <div>
                  <button onClick={() => setShowNotFound(!showNotFound)} className="text-yellow-400 text-xs font-bold hover:underline">
                    {showNotFound ? "Ocultar" : "Ver"} productos no encontrados ({result.notFound})
                  </button>
                  {showNotFound && (
                    <div className="mt-2 bg-black/30 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1">
                      <p className="text-gray-500 text-[10px] uppercase font-bold mb-2">
                        No están en la BD — revisa el nombre del modelo o sabor
                      </p>
                      {result.notFoundList.map((item, i) => (
                        <div key={i} className="flex justify-between text-xs py-0.5">
                          <span className="text-yellow-400">{item.modelo}</span>
                          <span className="text-gray-400">{item.sabor}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-red-400 font-bold">
              <AlertCircle size={20} />
              {result.error ?? "Error al procesar el archivo"}
            </div>
          )}
        </div>
      )}
    </div>
  )
}