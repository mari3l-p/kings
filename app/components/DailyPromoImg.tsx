"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/app/lib/supabase"

export default function DailyPromoBanner() {
    const [promo, setPromo] = useState<any>(null)

    useEffect(() => {
        const fetchTodayPromo = async () => {
            const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
            const hoy = diasSemana[new Date().getDay()] // Obtiene el día actual

            const { data, error } = await supabase
                .from("daily_promos")
                .select("*")
                .eq("dia_semana", hoy)
                .eq("activo", true)
                .single() // Solo queremos una promo por día

            if (data) setPromo(data)
        }

        fetchTodayPromo()
    }, [])

    if (!promo) return null // Si no hay promo hoy, no mostramos nada
    
    return (
        <div className="mt-19">
            {promo.imagen_url && (
                    <div>
                        <h2 className="text-white text-3xl md:text-5xl font-medium uppercase mb-12 text-center tracking-tighter">
                            Promo del <span className="text-(--pink-75)">Día</span>
                        </h2>
                        <div className="w-full md:w-150 md:h-200">
                            <img 
                                src={promo.imagen_url} 
                                alt={promo.nombre} 
                                className="w-full h-full rounded-2xl object-cover"
                            />
                        </div>
                    </div>
                )}
        </div>
    )
}