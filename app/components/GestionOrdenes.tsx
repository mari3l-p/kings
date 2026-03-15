"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/app/lib/supabase"

interface productosTipo {
    id: number;
    sabor: string;
    modelo: string;
}

interface ordenesTipo {
    id: number;
    nombre_cliente: string;
    productos: productosTipo | null;
    telefono: string;
    total: number;
    entrega: string;
    pago: string;
    created_at: string;
}

export default function GestionOrdenes() {
    const [pedidos, setPedidos] = useState<ordenesTipo[]>([])
    const [loading, setLoading] = useState(true)

    const cargarPedidos = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from("ordenes")
            .select("*, productos(id, sabor, modelo)")
            .order("id", { ascending: false })

        if (error) console.error("Error cargando:", error)
        else setPedidos(data as any as ordenesTipo[])
        setLoading(false)
    }

    useEffect(() => { cargarPedidos() }, [])

    // Group orders by cliente+telefono+created_at to show them as one sale
    const pedidosAgrupados = pedidos.reduce((acc, p) => {
        // Use telefono + truncated timestamp as group key (same person, same minute = same order)
        const fecha = new Date(p.created_at)
        const key = `${p.telefono}-${fecha.getFullYear()}${fecha.getMonth()}${fecha.getDate()}${fecha.getHours()}${fecha.getMinutes()}`
        if (!acc[key]) {
            acc[key] = {
                nombre_cliente: p.nombre_cliente,
                telefono: p.telefono,
                created_at: p.created_at,
                items: [],
                totalVenta: 0,
            }
        }
        acc[key].items.push(p)
        acc[key].totalVenta += p.total
        return acc
    }, {} as Record<string, any>)

    const ventas = Object.values(pedidosAgrupados)

    if (loading) return (
        <div className="text-center py-20 text-gray-500">Cargando historial...</div>
    )

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <p className="text-gray-400 text-sm">{ventas.length} ventas registradas</p>
                <button
                    onClick={cargarPedidos}
                    className="text-xs text-gray-500 hover:text-(--pink-75) transition-colors"
                >
                    Actualizar
                </button>
            </div>

            {ventas.length === 0 ? (
                <p className="text-gray-500 text-center py-10">No hay ventas registradas.</p>
            ) : (
                ventas.map((venta, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        {/* Sale header */}
                        <div className="flex justify-between items-start p-4 border-b border-white/5">
                            <div>
                                <p className="font-bold text-white uppercase text-sm">{venta.nombre_cliente}</p>
                                <p className="text-gray-500 text-xs mt-0.5">{venta.telefono}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-white font-black text-lg">${venta.totalVenta}</p>
                                <p className="text-gray-500 text-[10px]">
                                    {new Date(venta.created_at).toLocaleDateString("es-MX", {
                                        day: "numeric", month: "short", year: "numeric",
                                        hour: "2-digit", minute: "2-digit"
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="px-4 py-2 space-y-1">
                            {venta.items.map((item: ordenesTipo) => (
                                <div key={item.id} className="flex justify-between text-xs py-1">
                                    <span className="text-gray-300">
                                        {item.productos?.modelo} — {item.productos?.sabor}
                                    </span>
                                    <span className="text-gray-400">${item.total}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}