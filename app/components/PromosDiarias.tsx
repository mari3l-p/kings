"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/app/lib/supabase"
import { Upload, Type, Percent, Clock, Hash, Tag, X } from "lucide-react"

export default function DailyPromos() {
    const [modelos, setModelos] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        nombre: "",
        dia_semana: "lunes",
        desc_tipo: "porcentaje",
        desc_valor: "",
        cantidad_pack: "1",
    })
    // ✅ Array of selected modelo ids instead of a single value
    const [modelosSeleccionados, setModelosSeleccionados] = useState<number[]>([])
    const [imagen, setImagen] = useState<File | null>(null)

    const dias = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]

    useEffect(() => { cargarModelos() }, [])

    async function cargarModelos() {
        const { data } = await supabase.from("modelos").select("id, nombre").order("nombre")
        if (data) setModelos(data)
    }

    const toggleModelo = (id: number) => {
        setModelosSeleccionados(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        )
    }

    async function crearPromoDiaria(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            let imagenUrl = ""
            if (imagen) {
                const nombreArchivo = `daily-${Date.now()}-${imagen.name}`
                await supabase.storage.from("daily_promos").upload(nombreArchivo, imagen)
                const { data: urlData } = supabase.storage.from("daily_promos").getPublicUrl(nombreArchivo)
                imagenUrl = urlData.publicUrl
            }

            // ✅ If no models selected = applies to all (insert one row with modelo_id null)
            // If models selected = insert one row per modelo
            const modeloIds = modelosSeleccionados.length === 0
                ? [null]
                : modelosSeleccionados

            const rowsToInsert = modeloIds.map(modeloId => ({
                nombre: form.nombre,
                dia_semana: form.dia_semana,
                desc_tipo: form.desc_tipo,
                desc_valor: parseFloat(form.desc_valor),
                cantidad_pack: form.desc_tipo === "pack" ? parseInt(form.cantidad_pack) : 1,
                modelo_id: modeloId,
                imagen_url: imagenUrl,
            }))

            const { error } = await supabase.from("daily_promos").insert(rowsToInsert)
            if (error) throw error

            alert(`✅ Promo guardada para ${modeloIds.length === 1 && modeloIds[0] === null ? "todos los modelos" : `${modeloIds.length} modelos`}`)
            
            // Reset form
            setModelosSeleccionados([])
            setImagen(null)
            setForm({ nombre: "", dia_semana: "lunes", desc_tipo: "porcentaje", desc_valor: "", cantidad_pack: "1" })

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

                {/* Día */}
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

                {/* Pack size */}
                {form.desc_tipo === "pack" && (
                    <div className="animate-in fade-in slide-in-from-left-2">
                        <label className={labelStyle}><Hash size={14}/> Cantidad en el Pack</label>
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

                {/* Valor */}
                <div>
                    <label className={labelStyle}>
                        <Percent size={14}/>
                        {form.desc_tipo === "porcentaje" ? "Porcentaje (%)" :
                         form.desc_tipo === "fijo" ? "Monto a descontar ($)" :
                         "Precio total del pack ($)"}
                    </label>
                    <input
                        type="number"
                        className={inputStyle}
                        placeholder={form.desc_tipo === "porcentaje" ? "Ej: 10" : "Ej: 500"}
                        value={form.desc_valor}
                        onChange={(e) => setForm({...form, desc_valor: e.target.value})}
                        required
                    />
                </div>
            </div>

            {/* ✅ Multi-select modelos */}
            <div>
                <label className={labelStyle}><Tag size={14}/> Modelos (deja vacío para aplicar a todos)</label>

                {/* Selected chips */}
                {modelosSeleccionados.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {modelosSeleccionados.map(id => {
                            const mod = modelos.find(m => m.id === id)
                            return (
                                <span key={id} className="flex items-center gap-1 bg-(--pink-75) text-white text-xs font-bold px-3 py-1.5 rounded-full">
                                    {mod?.nombre}
                                    <button type="button" onClick={() => toggleModelo(id)}>
                                        <X size={12}/>
                                    </button>
                                </span>
                            )
                        })}
                    </div>
                )}

                {/* Modelo grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                    {modelos.map(mod => {
                        const selected = modelosSeleccionados.includes(mod.id)
                        return (
                            <button
                                key={mod.id}
                                type="button"
                                onClick={() => toggleModelo(mod.id)}
                                className={`text-left px-3 py-2 rounded-xl text-sm border transition-all
                                    ${selected
                                        ? "bg-(--pink-75) border-(--pink-75) text-white font-bold"
                                        : "bg-black/40 border-white/10 text-gray-400 hover:border-(--pink-75)/50"
                                    }`}
                            >
                                {mod.nombre}
                            </button>
                        )
                    })}
                </div>

                {modelosSeleccionados.length === 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                        Sin selección → aplica a <span className="text-yellow-500 font-bold">todos los modelos</span>
                    </p>
                )}
            </div>

            {/* Imagen */}
            <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-(--pink-75)/40 transition-colors relative">
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setImagen(e.target.files?.[0] || null)}
                />
                <div className="space-y-2">
                    <Upload className="mx-auto text-gray-500" size={24} />
                    <p className="text-sm text-gray-400">
                        {imagen
                            ? <span className="text-(--pink-75) font-bold">{imagen.name}</span>
                            : "Imagen para el banner diario"
                        }
                    </p>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-(--pink-75) hover:text-white transition-all transform active:scale-95"
            >
                {loading ? "Guardando..." : `Guardar Promo${modelosSeleccionados.length > 1 ? ` (${modelosSeleccionados.length} modelos)` : ""}`}
            </button>
        </form>
    )
}