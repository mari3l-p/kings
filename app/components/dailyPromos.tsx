"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/app/lib/supabase"
import { Upload, Calendar, Tag, Type, Percent, Clock, Hash } from "lucide-react"

export default function DailyPromos() {
    const [modelos, setModelos] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        nombre: "",           // Asegúrate de que tenga ""
        dia_semana: "lunes",
        desc_tipo: "porcentaje",
        desc_valor: "",       // Asegúrate de que tenga ""
        modelo_id: "",        // Asegúrate de que tenga ""
        cantidad_pack: "1",   // Asegúrate de que tenga "1"
    })
    const [imagen, setImagen] = useState<File | null>(null)

    const dias = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]

    useEffect(() => {
        cargarModelos()
    }, [])

    async function cargarModelos() {
        const { data } = await supabase.from("modelos").select("id, nombre")
        if (data) setModelos(data)
    }

    async function crearPromoDiaria(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        
        try {
            let imagenUrl = ""
            if (imagen) {
                const nombreArchivo = `daily-${Date.now()}-${imagen.name}`
                const { data: uploadData } = await supabase.storage.from("daily_promos").upload(nombreArchivo, imagen)
                const { data: urlData } = supabase.storage.from("daily_promos").getPublicUrl(nombreArchivo)
                imagenUrl = urlData.publicUrl
            }

            const { error } = await supabase.from("daily_promos").insert([{
                ...form,
                desc_valor: parseFloat(form.desc_valor),
                cantidad_pack: form.desc_tipo === "pack" ? parseInt(form.cantidad_pack) : 1,
                modelo_id: form.modelo_id || null,
                imagen_url: imagenUrl
            }])

            if (error) throw error
            alert("✅ Promo diaria guardada")
        } catch (err) {
            console.error(err)
            alert("Error al guardar")
        } finally {
            setLoading(false)
        }
    }

    const inputStyle = "w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-(--pink-75) transition-all text-sm"
    const labelStyle = "flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-2"

    return (
        <form onSubmit={crearPromoDiaria} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Día de la Semana */}
                <div>
                    <label className={labelStyle}><Clock size={14}/> Día de la Promo</label>
                    <select 
                        className={inputStyle}
                        value={form.dia_semana}
                        onChange={(e) => setForm({...form, dia_semana: e.target.value})}
                    >
                        {dias.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                    </select>
                </div>

                {/* Nombre */}
                <div>
                    <label className={labelStyle}><Type size={14}/> Nombre Visible</label>
                    <input 
                        className={inputStyle} 
                        placeholder="Ej: Lunes de Locura"
                        value={form.nombre}
                        onChange={(e) => setForm({...form, nombre: e.target.value})}
                        required
                    />
                </div>

                {/* Modelo Específico (Opcional) */}
                <div>
                    <label className={labelStyle}><Tag size={14}/> Modelo (Opcional)</label>
                    <select 
                        className={inputStyle}
                        value={form.modelo_id}
                        onChange={(e) => setForm({...form, modelo_id: e.target.value})}
                    >
                        <option value="">Todos los modelos</option>
                        {modelos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                    </select>
                </div>

                {/* Tipo de Descuento */}
                <div>
                    <label className={labelStyle}><Percent size={14}/> Tipo de Promo</label>
                    <select 
                        className={inputStyle}
                        value={form.desc_tipo}
                        onChange={(e) => setForm({...form, desc_tipo: e.target.value})}
                    >
                        <option value="porcentaje">Porcentaje %</option>
                        <option value="fijo">Descuento Fijo $</option>
                        <option value="pack">Combo / Pack</option>
                    </select>
                </div>

                {/* --- CAMPOS DINÁMICOS --- */}
                
                {form.desc_tipo === "pack" && (
                    <div className="animate-in fade-in slide-in-from-left-2">
                        <label className={labelStyle}><Hash size={14}/> Cantidad de Vapes en el Pack</label>
                        <input 
                            type="number"
                            className={inputStyle} 
                            placeholder="Ej: 2 (para un 2x$400)"
                            value={form.cantidad_pack}
                            onChange={(e) => setForm({...form, cantidad_pack: e.target.value})}
                            required
                        />
                    </div>
                )}

                <div>
                    <label className={labelStyle}>
                        <Percent size={14}/> 
                        {form.desc_tipo === "porcentaje" ? "Porcentaje de Descuento (%)" : 
                         form.desc_tipo === "fijo" ? "Dinero a descontar ($)" : 
                         "Precio Total del Pack ($)"}
                    </label>
                    <input 
                        type="number"
                        className={inputStyle} 
                        placeholder={form.desc_tipo === "porcentaje" ? "Ej: 15" : "Ej: 500"}
                        value={form.desc_valor}
                        onChange={(e) => setForm({...form, desc_valor: e.target.value})}
                        required
                    />
                </div>
            </div>

            {/* Subida de Imagen */}
            <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-(--pink-75)/40 transition-colors relative">
                <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setImagen(e.target.files?.[0] || null)} 
                />
                <div className="space-y-2">
                    <Upload className="mx-auto text-gray-500" size={24} />
                    <p className="text-sm text-gray-400">
                        {imagen ? <span className="text-(--pink-75) font-bold">{imagen.name}</span> : "Imagen para el banner diario"}
                    </p>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-(--pink-75) hover:text-white transition-all transform active:scale-95"
            >
                {loading ? "Guardando..." : "Configurar Promo Diaria"}
            </button>
        </form>
    )
}