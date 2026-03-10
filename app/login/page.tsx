"use client"
import { useState } from "react"
import { supabase } from "@/app/lib/supabase"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert("Error: " + error.message)
    } else {
      router.push("/admin") // Si entra, lo mandamos al panel
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <form onSubmit={handleLogin} className="w-full max-w-md bg-white/5 p-10 rounded-3xl border border-white/10">
        <h1 className="text-white text-3xl font-semibold mb-8 tracking-tighter text-center">
          Inicia Sesión
        </h1>
        
        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="Email de Admin"
            className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none focus:border-(--pink-75) transition-all"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Contraseña"
            className="w-full bg-black border border-white/10 p-4 rounded-xl text-white outline-none focus:border-(--pink-75) transition-all"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-(--pink-75) text-white font-bold p-4 rounded-xl uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Entrar al Panel"}
          </button>
        </div>
      </form>
    </div>
  )
}