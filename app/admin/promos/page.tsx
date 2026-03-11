"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/app/lib/supabase"
import { Upload, Calendar, Tag, Type, Percent } from "lucide-react"

interface modelosType {
    nombre: string,
    id: number,
}

export default function CrearPromocion() {
    const [modelos, setModelos] = useState<modelosType[] | null>([])
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        nombre: "",
        categoria: "",
        desc_tipo: "porcentaje", // Ahora aceptará "porcentaje", "fijo", o "pack"
        desc_valor: "",         // Precio total (ej: 400)
        cantidad_pack: "1",     // Cantidad de vapes (ej: 2)
        comienza: "",
        termina: ""
    })

    const [imagen, setImagen] = useState<File | null>(null)

    useEffect(() => {
        cargarProductos()
    }, [])

    async function cargarProductos() {
        const { data } = await supabase.from("modelos").select("id, nombre")
        setModelos(data)
    }

    async function crearPromocion(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        try {
            const fechaInicio = new Date(form.comienza).toISOString();
            const fechaFin = new Date(form.termina).toISOString();
            const imagenUrl = await subirImagen()

            const { error } = await supabase
                .from("promos")
                .insert([{
                    nombre: form.nombre,
                    categoria: form.categoria,
                    desc_tipo: form.desc_tipo,
                    desc_valor: form.desc_valor,
                    cantidad_pack: form.desc_tipo === "pack" ? parseInt(form.cantidad_pack) : 1, // <--- Nuevo
                    comienza: fechaInicio,
                    termina: fechaFin,
                    activo: true,
                    imagen: imagenUrl,
                }])

            if (error) throw error
            alert("✨ Promoción creada con éxito")
            // Opcional: limpiar form aquí
        } catch (error) {
            console.log(error)
            alert("Error creando promoción")
        } finally {
            setLoading(false)
        }
    }

    async function subirImagen() {
        if (!imagen) {
            alert("Selecciona una imagen primero");
            return null;
        }
        const nombreArchivo = `${Date.now()}-${imagen.name}`;
        const { data, error } = await supabase.storage.from("promos").upload(nombreArchivo, imagen);
        if (error) {
            console.error("Error subiendo:", error);
            return null;
        }
        const { data: urlData } = supabase.storage.from("promos").getPublicUrl(nombreArchivo);
        return urlData.publicUrl;
    }

    // Estilo común para los inputs
    const inputStyle = "w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-(--pink-75) transition-all placeholder:text-gray-600 text-sm"
    const labelStyle = "flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-2"

    return (
        <form onSubmit={crearPromocion} className="max-w-4xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Nombre de la Promo */}
                <div className="col-span-1 md:col-span-2">
                    <label className={labelStyle}><Type size={14}/> Nombre de la Promoción</label>
                    <input
                        className={inputStyle}
                        placeholder="Ej: Hot Sale Waka"
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                        required
                    />
                </div>

                {/* Categoría */}
                <div>
                    <label className={labelStyle}><Tag size={14}/> Aplicar a Categoría</label>
                    <select
                        className={inputStyle}
                        value={form.categoria}
                        onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                        required
                    >
                        <option value="">Seleccionar categoria</option>
                        {modelos?.map(m => (
                            <option key={m.id} value={m.nombre}>{m.nombre}</option>
                        ))}
                    </select>
                </div>

                    {/* Tipo de Descuento y Valor */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={labelStyle}><Percent size={14}/> Tipo de Promo</label>
                            <select
                                className={inputStyle}
                                value={form.desc_tipo}
                                onChange={(e) => setForm({ ...form, desc_tipo: e.target.value })}
                            >
                                <option value="porcentaje">Porcentaje %</option>
                                <option value="fijo">Descuento Fijo $</option>
                                <option value="pack">Pack / Combo</option>
                            </select>
                        </div>

                        {form.desc_tipo === "pack" && (
                            <div>
                                <label className={labelStyle}>Cant. de Vapes</label>
                                <input
                                    type="number"
                                    className={inputStyle}
                                    placeholder="Ej: 2"
                                    value={form.cantidad_pack}
                                    onChange={(e) => setForm({ ...form, cantidad_pack: e.target.value })}
                                />
                            </div>
                        )}

        <div>
            <label className={labelStyle}>
                {form.desc_tipo === "pack" ? "Precio Total del Pack" : "Valor del Descuento"}
            </label>
            <input
                type="number"
                className={inputStyle}
                placeholder={form.desc_tipo === "pack" ? "400" : "0"}
                value={form.desc_valor}
                onChange={(e) => setForm({ ...form, desc_valor: e.target.value })}
                required
            />
        </div>
    </div>

                {/* Fechas */}
                <div>
                    <label className={labelStyle}><Calendar size={14}/> Fecha de Inicio</label>
                    <input
                        type="datetime-local"
                        className={inputStyle}
                        onChange={(e) => setForm({ ...form, comienza: e.target.value })}
                        required
                    />
                </div>

                <div>
                    <label className={labelStyle}><Calendar size={14}/> Fecha de Fin</label>
                    <input
                        type="datetime-local"
                        className={inputStyle}
                        onChange={(e) => setForm({ ...form, termina: e.target.value })}
                        required
                    />
                </div>

                {/* Subida de Imagen */}
                <div className="col-span-1 md:col-span-2">
                    <label className={labelStyle}><Upload size={14}/> Imagen de la Promo (Banner)</label>
                    <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-8 hover:border-(--pink-75)/50 transition-colors text-center">
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => {
                                const files = e.target.files;
                                if (files && files.length > 0) setImagen(files[0]);
                            }}
                        />
                        <div className="space-y-2">
                            <Upload className="mx-auto text-gray-500" size={30} />
                            <p className="text-sm text-gray-400">
                                {imagen ? <span className="text-(--pink-75) font-bold">{imagen.name}</span> : "Haz clic o arrastra una imagen"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-(--pink-75) hover:bg-(--pink-35) text-white font-bold py-4 rounded-xl uppercase tracking-[0.2em] transition-all transform active:scale-95 disabled:opacity-50 mt-8"
            >
                {loading ? "Procesando..." : "Lanzar Promoción"}
            </button>
        </form>
    )
}