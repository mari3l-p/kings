"use client"

import React, { useEffect, useState } from "react"
import { Tag, Package, BarChart3, LogOut, Menu, X, Megaphone } from "lucide-react"
import CrearPromocion from "./promos/page"
import { supabase } from "../lib/supabase"
import { useRouter } from "next/navigation"
import GestionOrdenes from "../components/GestionOrdenes"
import DailyPromos from "../components/PromosDiarias"
import GestionAnuncios from "../components/GestionAnuncios"

const AdminPage = () => {
    const [tab, setTab] = useState("stats")
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [totalStock, setTotalStock] = useState<number | null>(null) // ✅ 1. Add this
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

    // ✅ 2. Add this fetch
    useEffect(() => {
        const fetchStock = async () => {
            const { data, error } = await supabase
                .from("productos")
                .select("stock")
            if (!error && data) {
                setTotalStock(data.reduce((sum, p) => sum + (p.stock || 0), 0))
            }
        }
        fetchStock()
    }, [])

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut()
        if (!error) router.push("/")
    }

    if (!user) return <div className="bg-black min-h-screen" />

    return (
        <div className="relative flex min-h-screen bg-[#050505] text-white isolation-isolate">
            
            <div className="lg:hidden">
                <div className="fixed bottom-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 z-9999">
                    <h1 className="font-bold text-sm tracking-tighter">
                        VAPE <span className="text-(--pink-75)">KINGS</span>
                    </h1>
                    <button 
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 bg-white/5 rounded-lg text-(--pink-75) active:scale-90 transition-transform"
                    >
                        <Menu size={24} />
                    </button>
                </div>

                <div 
                    className={`fixed inset-0 bg-black z-10000 transition-all duration-300 transform ${
                        sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                    }`}
                >
                    <div className="p-8 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-12">
                            <h2 className="text-2xl font-bold tracking-tighter">MENU</h2>
                            <button onClick={() => setSidebarOpen(false)} className="p-2 bg-white/10 rounded-full">
                                <X size={28} />
                            </button>
                        </div>
                        <nav className="space-y-6">
                            {[
                                { id: "stats", label: "Estadísticas", icon: BarChart3 },
                                { id: "promos", label: "Promociones", icon: Tag },
                                { id: "dailyPromos", label: "Promociones Diarias", icon: Tag },
                                { id: "productos", label: "Inventario", icon: Package },
                                { id: "anuncios", label: "Anuncios", icon: Megaphone }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => { setTab(item.id); setSidebarOpen(false) }}
                                    className={`w-full flex items-center gap-6 p-4 rounded-3xl text-xl font-bold transition-all ${
                                        tab === item.id ? "bg-(--pink-75) shadow-lg shadow-pink-500/20" : "text-gray-500"
                                    }`}
                                >
                                    <item.icon size={28} />
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                        <button onClick={handleLogout} className="mt-auto flex items-center gap-4 p-4 mb-8 lg:mb-0 text-red-500 font-bold">
                            <LogOut size={24} /> CERRAR SESIÓN
                        </button>
                    </div>
                </div>
            </div>

            <aside className="hidden lg:flex flex-col w-72 bg-[#080808] border-r border-white/10 p-6 h-screen sticky top-0">
                <div className="mb-10 px-2 font-bold">
                    <h1 className="text-xl tracking-tighter">
                        THE VAPE <span className="text-(--pink-75)">KINGS</span>
                    </h1>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Admin Panel</p>
                </div>
                <nav className="flex-1 space-y-3 mt-4 md:mt-0">
                    <button onClick={() => setTab("stats")} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${tab === "stats" ? "bg-(--pink-75)" : "text-gray-400 hover:bg-white/5"}`}>
                        <BarChart3 size={22} /> <span className="text-sm font-bold uppercase tracking-widest">Estadísticas</span>
                    </button>
                    <button onClick={() => setTab("promos")} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${tab === "promos" ? "bg-(--pink-75)" : "text-gray-400 hover:bg-white/5"}`}>
                        <Tag size={22} /> <span className="text-sm font-bold uppercase tracking-widest">Promociones</span>
                    </button>
                    <button onClick={() => setTab("dailyPromos")} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${tab === "dailyPromos" ? "bg-(--pink-75)" : "text-gray-400 hover:bg-white/5"}`}>
                        <Tag size={22} /> <span className="text-sm font-bold uppercase tracking-widest">Daily Promos</span>
                    </button>
                    <button onClick={() => setTab("productos")} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${tab === "productos" ? "bg-(--pink-75)" : "text-gray-400 hover:bg-white/5"}`}>
                        <Package size={22} /> <span className="text-sm font-bold uppercase tracking-widest">Inventario</span>
                    </button>
                    <button onClick={() => setTab("anuncios")} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${tab === "anuncios" ? "bg-(--pink-75)" : "text-gray-400 hover:bg-white/5"}`}>
                        <Megaphone size={22} /> <span className="text-sm font-bold uppercase tracking-widest">Anuncios</span>
                    </button>
                </nav>
                <button onClick={handleLogout} className="flex items-center gap-4 px-4 py-4 text-red-500/60 hover:text-red-500 border-t border-white/5 mt-auto pt-6">
                    <LogOut size={22} /> <span className="text-sm font-bold uppercase tracking-widest">Cerrar Sesión</span>
                </button>
            </aside>

            <main className="flex-1 min-w-0 min-h-screen pt-20 lg:pt-0">
                <div className="p-6 sm:p-8 lg:p-12 max-w-6xl mx-auto">
                    <header className="mb-8">
                        <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tighter italic">
                            {tab === "stats" && "Resumen General"}
                            {tab === "promos" && "Promociones"}
                            {tab === "productos" && "Inventario de Vapes"}
                            {tab === "anuncios" && "Anuncios"}
                        </h2>
                        <div className="h-1 w-20 bg-(--pink-75) mt-2" />
                    </header>

                    <div className="bg-[#0f0f0f] border border-white/5 rounded-[2.5rem] p-4 sm:p-8">
                        {tab === "stats" && (
                            // ✅ 3. Replace this block
                            <div className="p-8 bg-black border border-white/10 rounded-3xl max-w-sm">
                                <p className="text-gray-500 text-xs uppercase font-bold tracking-[0.2em] mb-3">Total en Inventario</p>
                                <span className="text-5xl font-bold tracking-tighter">
                                    {totalStock === null ? "..." : totalStock}
                                </span>
                                <p className="text-gray-600 text-sm mt-2">vapes en stock</p>
                            </div>
                        )}
                        {tab === "promos" && <CrearPromocion />}
                        {tab === "productos" && <GestionOrdenes />}
                        {tab === "dailyPromos" && <DailyPromos/>}
                        {tab == "anuncios" && <GestionAnuncios/>}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default AdminPage