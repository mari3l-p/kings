"use client"

import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Image from 'next/image'
import Link from 'next/link'

interface CategoriaCard {
    id: number;
    nombre: string;
    imagen: string; // La imagen que representa a la categoría/modelo
}

const CategoriasRandom = () => {
    const [categorias, setCategorias] = useState<CategoriaCard[]>([]);

    async function cargarCategorias() {
        // Traemos las categorías (modelos)
        const { data, error } = await supabase
            .from("modelos")
            .select("id, nombre, imagen")
            // Opcional: podrías filtrar por stock aquí también si tienes esa lógica
            
        if (error) {
            console.error("Error cargando categorías:", error);
            return;
        }

        if (data) {
            // Mezclamos y tomamos 3 o 4 para el diseño
            const shuffle = data.sort(() => 0.5 - Math.random());
            setCategorias(shuffle.slice(0, 4));
        }
    }

    useEffect(() => {
        cargarCategorias();
    }, []);

    if (categorias.length === 0) return null;

    return (
        <section className="py-20 px-6 bg-black">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-white text-3xl md:text-5xl font-medium uppercase mb-12 text-center tracking-tighter">
                    Explora por <span className="text-(--pink-75)">Modelo</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {categorias.map((cat) => (
                        <Link href={"/catalogo"} key={cat.id}>
                            <div className="group relative h-100 overflow-hidden rounded-3xl border border-white/10">
                                {/* Imagen de fondo */}
                                
                                    <Image 
                                        src={cat.imagen} 
                                        alt={cat.nombre}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                                    />
                                
                                {/* Overlay Gradiente para legibilidad */}
                                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent" />

                                {/* Contenido sobre la imagen */}
                                <div className="absolute inset-0 flex flex-col justify-end p-8 items-center text-center">
                                    <h3 className="text-white text-2xl uppercase mb-4 tracking-widest">
                                        {cat.nombre}
                                    </h3>
                                    
                                    <Link 
                                        href={`/catalogo?categoria=${cat.nombre.toLowerCase()}`}
                                        className="bg-(--pink-75) text-white px-6 py-3 rounded-full font-bold uppercase text-xs tracking-widest 
                                                transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 
                                                transition-all duration-300 hover:bg-white hover:text-black shadow-lg"
                                    >
                                        Comprar
                                    </Link>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CategoriasRandom;