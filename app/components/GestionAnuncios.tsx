"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/app/lib/supabase"
import { Upload, Calendar, Type, Trash2, RefreshCw } from "lucide-react"

interface Anuncio {
    id: number
    nombre: string
    imagen_url: string
    comienza: string
    termina: string
    activo: boolean
}

export default function GestionAnuncios() {
    const [anuncios, setAnuncios] = useState<Anuncio[]>([])
    const [loading, setLoading] = useState(false)
    const [imagen, setImagen] = useState<File | null>(null)
    const [form, setForm] = useState({
        nombre: "",
        comienza: "",
        termina: "",
    })

    const inputStyle = "w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-(--pink-75) transition-all placeholder:text-gray-600 text-sm"
    const labelStyle = "flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-2"

    useEffect(() => { fetchAnuncios() }, [])

    async function fetchAnuncios() {
        const { data } = await supabase
            .from("anuncios")
            .select("*")
            .order("comienza", { ascending: false })
        setAnuncios(data ?? [])
    }

    async function handleCrear(e: React.FormEvent) {
        e.preventDefault()
        if (!imagen) { alert("Selecciona una imagen"); return }
        setLoading(true)

        try {
            // Upload image
            const nombreArchivo = `anuncio-${Date.now()}-${imagen.name}`
            const { error: uploadError } = await supabase.storage
                .from("anuncios")
                .upload(nombreArchivo, imagen)
            if (uploadError) throw uploadError

            const { data: urlData } = supabase.storage
                .from("anuncios")
                .getPublicUrl(nombreArchivo)

            // Insert row
            const { error } = await supabase.from("anuncios").insert([{
                nombre: form.nombre,
                imagen_url: urlData.publicUrl,
                comienza: form.comienza,
                termina: form.termina,
                activo: true,
            }])
            if (error) throw error

            alert("✅ Anuncio creado")
            setForm({ nombre: "", comienza: "", termina: "" })
            setImagen(null)
            fetchAnuncios()
        } catch (err) {
            console.error(err)
            alert("Error al crear anuncio")
        } finally {
            setLoading(false)
        }
    }

    async function handleEliminar(id: number) {
        if (!confirm("¿Eliminar este anuncio?")) return
        await supabase.from("anuncios").delete().eq("id", id)
        fetchAnuncios()
    }

    async function handleToggle(id: number, activo: boolean) {
        await supabase.from("anuncios").update({ activo: !activo }).eq("id", id)
        fetchAnuncios()
    }

    const hoy = new Date().toISOString().split("T")[0]

    return (
        <div className="space-y-10 max-w-2xl mx-auto">

            {/* Form */}
            <form onSubmit={handleCrear} className="space-y-5">
                <div>
                    <label className={labelStyle}><Type size={14}/> Nombre del Anuncio</label>
                    <input
                        className={inputStyle}
                        placeholder="Ej: Regala Flores Regala Humo"
                        value={form.nombre}
                        onChange={e => setForm({...form, nombre: e.target.value})}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelStyle}><Calendar size={14}/> Fecha Inicio</label>
                        <input
                            type="date"
                            className={inputStyle}
                            value={form.comienza}
                            onChange={e => setForm({...form, comienza: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <label className={labelStyle}><Calendar size={14}/> Fecha Fin</label>
                        <input
                            type="date"
                            className={inputStyle}
                            value={form.termina}
                            onChange={e => setForm({...form, termina: e.target.value})}
                            required
                        />
                    </div>
                </div>

                {/* Image upload */}
                <div
                    onClick={() => document.getElementById("anuncio-img-input")?.click()}
                    className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-(--pink-75)/40 transition-colors"
                >
                    <input
                        id="anuncio-img-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => setImagen(e.target.files?.[0] || null)}
                    />
                    <Upload className="mx-auto text-gray-500 mb-2" size={28} />
                    <p className="text-sm text-gray-400">
                        {imagen
                            ? <span className="text-(--pink-75) font-bold">{imagen.name}</span>
                            : "Haz clic para subir la imagen del anuncio"
                        }
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-(--pink-75) text-white font-bold py-4 rounded-xl uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40"
                >
                    {loading ? <RefreshCw size={18} className="animate-spin mx-auto" /> : "📢 Publicar Anuncio"}
                </button>
            </form>

            {/* Existing anuncios */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Anuncios creados</h3>
                {anuncios.length === 0 && (
                    <p className="text-gray-600 text-sm">No hay anuncios aún.</p>
                )}
                {anuncios.map(a => {
                    const vigente = a.activo && a.comienza <= hoy && a.termina >= hoy
                    return (
                        <div key={a.id} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
                            <img src={a.imagen_url} alt={a.nombre} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-bold text-sm truncate">{a.nombre}</p>
                                <p className="text-gray-500 text-xs mt-0.5">{a.comienza} → {a.termina}</p>
                                <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    vigente ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-500"
                                }`}>
                                    {vigente ? "● Activo ahora" : a.termina < hoy ? "Expirado" : "Próximamente"}
                                </span>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                                <button
                                    onClick={() => handleToggle(a.id, a.activo)}
                                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                                        a.activo
                                            ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                                            : "bg-white/10 text-gray-400 hover:bg-white/20"
                                    }`}
                                >
                                    {a.activo ? "Pausar" : "Activar"}
                                </button>
                                <button
                                    onClick={() => handleEliminar(a.id)}
                                    className="text-xs px-3 py-1.5 rounded-lg font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                                >
                                    <Trash2 size={13} className="mx-auto" />
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}