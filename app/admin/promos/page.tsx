"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/app/lib/supabase"
import { Upload, Calendar, Tag, Type, Percent, Boxes, X, Plus } from "lucide-react"
import { uploadImage } from "@/app/lib/uploadImage"

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
        desc_tipo: "porcentaje",
        desc_valor: "",
        cantidad_pack: "1",
        comienza: "",
        termina: ""
    })

    const [imagen, setImagen] = useState<File | null>(null)

    // ── Paquete de modelos distintos ──
    const [paqueteItems, setPaqueteItems] = useState<modelosType[]>([])
    const [productoSeleccionado, setProductoSeleccionado] = useState("")

    useEffect(() => {
        cargarModelos()
    }, [])

    async function cargarModelos() {
        const { data } = await supabase.from("modelos").select("id, nombre")
        setModelos(data)
    }

    function agregarAlPaquete() {
        if (!productoSeleccionado) return
        const modelo = modelos?.find(m => String(m.id) === productoSeleccionado)
        if (!modelo) return
        if (paqueteItems.some(p => p.id === modelo.id)) {
            alert("Ese modelo ya está en el paquete")
            return
        }
        setPaqueteItems([...paqueteItems, modelo])
        setProductoSeleccionado("")
    }

    function quitarDelPaquete(id: number) {
        setPaqueteItems(paqueteItems.filter(p => p.id !== id))
    }

    async function crearPromocion(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()

        if (form.desc_tipo === "paquete" && paqueteItems.length < 2) {
            alert("Agrega al menos 2 productos distintos al paquete")
            return
        }

        setLoading(true)

        try {
            const fechaInicio = new Date(form.comienza).toISOString()
            const fechaFin = new Date(form.termina).toISOString()

            // ✅ Sube a Cloudinary en vez de Supabase Storage
            let imagenUrl: string | null = null
            if (imagen) {
                imagenUrl = await uploadImage(imagen, 'promos')
                if (!imagenUrl) throw new Error("Error subiendo imagen a Cloudinary")
            }

            const { error } = await supabase
                .from("promos")
                .insert([{
                    nombre: form.nombre,
                    categoria: form.desc_tipo === "paquete" ? null : form.categoria,
                    desc_tipo: form.desc_tipo,
                    desc_valor: form.desc_valor,
                    cantidad_pack: form.desc_tipo === "pack"
                        ? parseInt(form.cantidad_pack)
                        : form.desc_tipo === "paquete"
                            ? paqueteItems.length
                            : 1,
                    paquete_items: form.desc_tipo === "paquete"
                        ? paqueteItems.map(p => ({ id: p.id, nombre: p.nombre }))
                        : null,
                    comienza: fechaInicio,
                    termina: fechaFin,
                    activo: true,
                    imagen: imagenUrl,
                }])

            if (error) throw error

            alert("✨ Promoción creada con éxito")

            // Limpiar form
            setForm({
                nombre: "",
                categoria: "",
                desc_tipo: "porcentaje",
                desc_valor: "",
                cantidad_pack: "1",
                comienza: "",
                termina: ""
            })
            setImagen(null)
            setPaqueteItems([])
            setProductoSeleccionado("")

        } catch (error) {
            console.log(error)
            alert("Error creando promoción")
        } finally {
            setLoading(false)
        }
    }

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

                {/* Tipo de Promo (siempre visible, decide el resto del form) */}
                <div className={form.desc_tipo === "paquete" ? "col-span-1 md:col-span-2" : ""}>
                    <label className={labelStyle}><Percent size={14}/> Tipo de Promo</label>
                    <select
                        className={inputStyle}
                        value={form.desc_tipo}
                        onChange={(e) => setForm({ ...form, desc_tipo: e.target.value })}
                    >
                        <option value="porcentaje">Porcentaje %</option>
                        <option value="fijo">Descuento Fijo $</option>
                        <option value="pack">Pack / Combo (mismo modelo)</option>
                        <option value="paquete">Paquete de Productos Distintos</option>
                    </select>
                </div>

                {/* Categoría — no aplica a paquetes de productos distintos */}
                {form.desc_tipo !== "paquete" && (
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
                )}

                {/* Cantidad + Valor para porcentaje / fijo / pack */}
                {form.desc_tipo !== "paquete" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 col-span-1 md:col-span-2">
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
                )}

                {/* Constructor de Paquete de Productos Distintos */}
                {form.desc_tipo === "paquete" && (
                    <div className="col-span-1 md:col-span-2 space-y-4 border border-white/10 rounded-2xl p-5 bg-black/20">
                        <label className={labelStyle}><Boxes size={14}/> Modelos del Paquete</label>
                        <p className="text-gray-500 text-xs -mt-2">
                            La promo solo aplica si el carrito tiene (cualquier sabor de) cada uno de estos modelos.
                        </p>

                        <div className="flex gap-2">
                            <select
                                className={inputStyle}
                                value={productoSeleccionado}
                                onChange={(e) => setProductoSeleccionado(e.target.value)}
                            >
                                <option value="">Seleccionar modelo</option>
                                {modelos
                                    ?.filter(m => !paqueteItems.some(pi => pi.id === m.id))
                                    .map(m => (
                                        <option key={m.id} value={m.id}>{m.nombre}</option>
                                    ))}
                            </select>
                            <button
                                type="button"
                                onClick={agregarAlPaquete}
                                disabled={!productoSeleccionado}
                                className="shrink-0 flex items-center gap-1 bg-(--pink-75) text-white text-sm font-bold px-4 rounded-xl disabled:opacity-40"
                            >
                                <Plus size={16} /> Agregar
                            </button>
                        </div>

                        {paqueteItems.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {paqueteItems.map(p => (
                                    <div
                                        key={p.id}
                                        className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full pl-3 pr-2 py-1.5 text-sm text-white"
                                    >
                                        {p.nombre}
                                        <button
                                            type="button"
                                            onClick={() => quitarDelPaquete(p.id)}
                                            className="text-gray-400 hover:text-red-400"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {paqueteItems.length > 0 && paqueteItems.length < 2 && (
                            <p className="text-yellow-400 text-xs">Agrega al menos 2 productos distintos.</p>
                        )}

                        <div>
                            <label className={labelStyle}>Precio Total del Paquete</label>
                            <input
                                type="number"
                                className={inputStyle}
                                placeholder="Ej: 599"
                                value={form.desc_valor}
                                onChange={(e) => setForm({ ...form, desc_valor: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                )}

                {/* Fechas */}
                <div>
                    <label className={labelStyle}><Calendar size={14}/> Fecha de Inicio</label>
                    <input
                        type="datetime-local"
                        className={inputStyle}
                        value={form.comienza}
                        onChange={(e) => setForm({ ...form, comienza: e.target.value })}
                        required
                    />
                </div>

                <div>
                    <label className={labelStyle}><Calendar size={14}/> Fecha de Fin</label>
                    <input
                        type="datetime-local"
                        className={inputStyle}
                        value={form.termina}
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
                                const files = e.target.files
                                if (files && files.length > 0) setImagen(files[0])
                            }}
                        />
                        <div className="space-y-2">
                            <Upload className="mx-auto text-gray-500" size={30} />
                            <p className="text-sm text-gray-400">
                                {imagen
                                    ? <span className="text-(--pink-75) font-bold">{imagen.name}</span>
                                    : "Haz clic o arrastra una imagen"
                                }
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
                {loading ? "Subiendo a Cloudinary..." : "Lanzar Promoción"}
            </button>
        </form>
    )
}