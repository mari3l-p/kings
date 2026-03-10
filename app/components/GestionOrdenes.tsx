"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/app/lib/supabase"
import { Check, X } from "lucide-react"

interface productosTipo {
    id: number;
    sabor: string;
    modelo: string;
    stock: number;
}

interface ordenesTipo {
    id: number;
    nombre_cliente: string;
    productos: productosTipo | null;
    telefono: string;
    total: number;
    estatus: string;
}

export default function GestionOrdenes() {
    const [pedidos, setPedidos] = useState<ordenesTipo[]>([])

    const cargarPedidos = async () => {
        const { data, error } = await supabase
            .from("ordenes")
            .select("*, productos(id, sabor, modelo, stock)")
            .order("id", { ascending: false })
        
        if (error) {
            console.error("Error cargando:", error)
        } else {
            setPedidos(data as any as ordenesTipo[])
        }
    }

    const actualizarEstado = async (id: number, nuevoEstado: string, prod: productosTipo | null) => {
        // 1. OPTIMISTIC UPDATE: Change UI immediately
        const previousState = [...pedidos];
        setPedidos(prev => prev.map(p => 
            p.id === id ? { ...p, estatus: nuevoEstado } : p
        ));

        try {
            // 2. Update Order Status
            const { error: updateError } = await supabase
                .from("ordenes")
                .update({ estatus: nuevoEstado })
                .eq("id", id);

            if (updateError) throw updateError;

            // 3. Update Stock only if sold
            if (nuevoEstado === "vendido" && prod) {
                const { error: stockError } = await supabase
                    .from("productos")
                    .update({ stock: prod.stock - 1 })
                    .eq("id", prod.id);
                
                if (stockError) throw stockError;
            }

            // 4. Final Sync
            await cargarPedidos();
            
        } catch (error: any) {
            console.error("Update failed:", error);
            alert(`Error: ${error.message}. Check your Supabase RLS Policies!`);
            // Revert UI if DB failed
            setPedidos(previousState);
        }
    }

    useEffect(() => { cargarPedidos() }, [])

    return (
        <div className="space-y-4">
            {pedidos.length === 0 ? (
                <p className="text-gray-500 text-center py-10">No hay órdenes registradas.</p>
            ) : (
                pedidos.map((p) => (
                    <div key={p.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${p.estatus === 'pendiente' ? 'bg-yellow-500' : p.estatus === 'vendido' ? 'bg-green-500' : 'bg-red-500'}`} />
                                <h4 className="text-white font-bold uppercase text-sm">
                                    {p.productos?.sabor} - {p.productos?.modelo}
                                </h4>
                            </div>
                            <p className="text-gray-500 text-xs">
                                Cliente: {p.nombre_cliente} ({p.telefono}) • ${p.total}
                            </p>
                            {p.productos && (
                                <p className="text-[10px] text-gray-600 mt-1 italic">Stock: {p.productos.stock}</p>
                            )}
                        </div>

                        <div className="flex gap-2">
                            {p.estatus === "pendiente" && (
                                <>
                                    <button 
                                        onClick={() => actualizarEstado(p.id, "vendido", p.productos)}
                                        className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all"
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button 
                                        onClick={() => actualizarEstado(p.id, "cancelado", null)}
                                        className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                    >
                                        <X size={18} />
                                    </button>
                                </>
                            )}
                            <span className="text-[10px] text-gray-400 uppercase font-bold self-center ml-4">
                                {p.estatus}
                            </span>
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}