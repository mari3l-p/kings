"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/app/lib/supabase"

interface BannerItem {
    id: number
    nombre: string
    imagen_url: string
    tipo: "promo" | "anuncio"
}

export default function DailyPromoBanner() {
    const [items, setItems] = useState<BannerItem[]>([])
    const [current, setCurrent] = useState(0)

    useEffect(() => {
        const fetch = async () => {
            const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
            const hoy = diasSemana[new Date().getDay()]
            const hoyFecha = new Date().toISOString().split("T")[0]

            // Fetch daily promos with image
            const { data: promos } = await supabase
                .from("daily_promos")
                .select("id, nombre, imagen_url")
                .eq("dia_semana", hoy)
                .not("imagen_url", "is", null)
                .neq("imagen_url", "")

            // Fetch active anuncios for today's date range
            const { data: anuncios } = await supabase
                .from("anuncios")
                .select("id, nombre, imagen_url")
                .eq("activo", true)
                .lte("comienza", hoyFecha)
                .gte("termina", hoyFecha)

            const combined: BannerItem[] = [
                ...(promos ?? []).map(p => ({ ...p, tipo: "promo" as const })),
                ...(anuncios ?? []).map(a => ({ ...a, tipo: "anuncio" as const })),
            ]

            setItems(combined)
        }

        fetch()
    }, [])

    // Auto-advance carousel
    useEffect(() => {
        if (items.length <= 1) return
        const interval = setInterval(() => {
            setCurrent(prev => (prev + 1) % items.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [items])

    if (items.length === 0) return null

    return (
        <div className="mt-19">
            <h2 className="text-white text-3xl md:text-5xl font-medium uppercase mb-12 text-center tracking-tighter">
                Promo del <span className="text-(--pink-75)">Día</span>
            </h2>

            <div className="relative w-full md:w-150 mx-auto overflow-hidden rounded-2xl">
                {/* Slides */}
                <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${current * 100}%)` }}
                >
                    {items.map(item => (
                        <div key={`${item.tipo}-${item.id}`} className="w-full shrink-0">
                            <img
                                src={item.imagen_url}
                                alt={item.nombre}
                                className="w-full h-full object-cover rounded-2xl"
                            />
                        </div>
                    ))}
                </div>

                {/* Dots — only show if more than 1 */}
                {items.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                        {items.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`h-2 rounded-full transition-all ${
                                    i === current ? "bg-white w-4" : "bg-white/40 w-2"
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}