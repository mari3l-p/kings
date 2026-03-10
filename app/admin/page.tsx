"use client"

import React, { useEffect, useState } from "react"
import { LayoutDashboard, Tag, Package, BarChart3, LogOut, Menu } from "lucide-react"
import CrearPromocion from "./promos/page"
import { supabase } from "../lib/supabase"
import { useRouter } from "next/navigation"
import GestionOrdenes from "../components/GestionOrdenes"

const AdminPage = () => {

    const [tab, setTab] = useState("stats")
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const [user, setUser] = useState<any>(null)
    const router = useRouter()

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push("/login")
            } else {
                setUser(user)
            }
        }
        checkUser()
    }, [router])

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut()

        if (!error) {
            router.push("/")
        }
    }

    if (!user) return <div className="bg-black min-h-screen" />

    return (
        <div className="flex min-h-screen bg-[#050505] text-white">

            {/* MOBILE TOP BAR */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-black border-b border-white/10 flex items-center justify-between px-4 h-16">
                <h1 className="font-bold">
                    VAPE <span className="text-(--pink-75)">ADMIN</span>
                </h1>

                <button onClick={() => setSidebarOpen(!sidebarOpen)}>
                    <Menu size={24} />
                </button>
            </div>

            {/* SIDEBAR */}
            <aside
                className={`
                fixed lg:static top-0 left-0 h-full w-64 bg-[#050505]
                border-r border-white/10 p-6 flex flex-col
                transform transition-transform duration-300 z-50
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                lg:translate-x-0
                `}
            >

                <div className="mb-10 px-2 font-medium hidden lg:block">
                    <h1 className="text-xl">
                        VAPE <span className="text-(--pink-75)">ADMIN</span>
                    </h1>
                </div>

                <nav className="flex-1 space-y-2 mt-10 lg:mt-0">

                    <button
                        onClick={() => {
                            setTab("stats")
                            setSidebarOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                        ${tab === "stats"
                                ? "bg-(--pink-75)"
                                : "text-gray-500 hover:bg-white/5"
                            }`}
                    >
                        <BarChart3 size={20} />
                        <span className="text-sm font-bold uppercase tracking-widest">
                            Estadísticas
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            setTab("promos")
                            setSidebarOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                        ${tab === "promos"
                                ? "bg-(--pink-75)"
                                : "text-gray-500 hover:bg-white/5"
                            }`}
                    >
                        <Tag size={20} />
                        <span className="text-sm font-bold uppercase tracking-widest">
                            Promociones
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            setTab("productos")
                            setSidebarOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                        ${tab === "productos"
                                ? "bg-(--pink-75)"
                                : "text-gray-500 hover:bg-white/5"
                            }`}
                    >
                        <Package size={20} />
                        <span className="text-sm font-bold uppercase tracking-widest">
                            Productos
                        </span>
                    </button>

                </nav>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-red-500/50 hover:text-red-500 transition-colors mt-auto"
                >
                    <LogOut size={20} />
                    <span className="text-sm font-bold uppercase tracking-widest">
                        Salir
                    </span>
                </button>

            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 pt-20 lg:pt-10 p-4 sm:p-6 lg:p-10 overflow-y-auto">

                <header className="mb-10">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-tighter">

                        {tab === "stats" && "Resumen de Ventas"}
                        {tab === "promos" && "Gestión de Promociones"}
                        {tab === "productos" && "Inventario de Vapes"}

                    </h2>

                    <p className="text-gray-500 text-xs sm:text-sm uppercase tracking-widest mt-1">
                        Panel de control administrativo
                    </p>
                </header>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-4 sm:p-6 lg:p-8">

                    {tab === "stats" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                            <div className="p-6 bg-black border border-white/10 rounded-2xl">
                                <p className="text-gray-500 text-xs uppercase mb-2">
                                    Total Productos
                                </p>
                                <span className="text-3xl font-bold">124</span>
                            </div>

                        </div>
                    )}

                    {tab === "promos" && (
                        <section className="animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-xl font-bold mb-6">
                                Crear Nueva Promo
                            </h3>

                            <CrearPromocion />
                        </section>
                    )}

                    {tab === "productos" && (
                        <GestionOrdenes />
                    )}

                </div>

            </main>

        </div>
    )
}

export default AdminPage