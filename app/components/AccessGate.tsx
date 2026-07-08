"use client"

import { useState, useEffect } from "react"

const CODIGO_SECRETO = "202607"

export default function AccessGate({ children }: { children: React.ReactNode }) {
    const [tieneAcceso, setTieneAcceso] = useState(false)
    const [codigo, setCodigo] = useState("")
    const [error, setError] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Revisa si ya ingresó el código antes en esta sesión
        const acceso = sessionStorage.getItem("vk_access")
        if (acceso === "true") setTieneAcceso(true)
        setLoading(false)
    }, [])

    const handleSubmit = () => {
        if (codigo.toLowerCase() === CODIGO_SECRETO.toLowerCase()) {
            sessionStorage.setItem("vk_access", "true")
            setTieneAcceso(true)
            setError(false)
        } else {
            setError(true)
            setCodigo("")
        }
    }

    if (loading) return <div className="bg-black min-h-screen" />

    if (tieneAcceso) return <>{children}</>

    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-6">
            <div className="w-full max-w-sm flex flex-col items-center gap-8">
                
                {/* Logo */}
                <div className="text-center">
                    <h1 className="text-4xl font-black">
                        THE VAPE <span style={{ color: 'var(--pink-75)' }}>KINGS</span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-2 uppercase">Acceso Exclusivo</p>
                </div>

                {/* Input */}
                <div className="w-full flex flex-col gap-3">
                    <input
                        type="text"
                        placeholder="Ingresa tu código"
                        value={codigo}
                        onChange={(e) => {
                            setCodigo(e.target.value)
                            setError(false)
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        className={`w-full bg-white/5 border rounded-2xl p-4 text-white text-center text-lg outline-none transition-all
                            ${error ? "border-red-500" : "border-white/10 focus:border-pink-500"}`}
                    />
                    {error && (
                        <p className="text-red-500 text-xs text-center ">
                            Código incorrecto. Intenta de nuevo.
                        </p>
                    )}
                    <button
                        onClick={handleSubmit}
                        className="w-full py-4 rounded-2xl font-bold text-white uppercase transition-all active:scale-95"
                        style={{ backgroundColor: 'var(--pink-75)' }}
                    >
                        Entrar
                    </button>
                </div>

                <p className="text-gray-600 text-xs text-center">
                    ¿No tienes código? Contáctanos por WhatsApp.
                </p>
            </div>
        </div>
    )
}