"use client"

import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface promoType {
    id: number;
    nombre: string;
    imagen: string;
    activo: boolean;
}

const PromoImg = () => {
    const [promos, setPromos] = useState<promoType[] | null>(null)

    async function getPromosActivas() {
        const ahora = new Date().toISOString();

        const { data, error } = await supabase
            .from("promos")
            .select("*")
            .eq("activo", true)
            .gt("termina", ahora)
            .lt("comienza", ahora);

        if (error) {
            console.error("Error cargando promos:", error);
            return;
        }

        setPromos(data);
    }

    useEffect(() => {
        getPromosActivas();
    }, []);

    // Si no hay promos, no renderizamos nada (o un esqueleto)
    if (!promos || promos.length === 0) return null;

    return (
        <div className='my-45'>
            <div className='text-5xl md:text-8xl font-semibold mb-10 text-(--background) bg-(--white) text-center py-4 uppercase'>
                Promos
            </div>

            <div className="space-y-10"> {/* Añadí espacio entre imágenes si hay varias */}
                {promos.map((promo) => (
                    <div key={promo.id} className="flex justify-center">
                        <img 
                            src={promo.imagen} 
                            alt={promo.nombre}
                            className='w-[80%] h-auto object-cover rounded-xl' 
                        />
                    </div>
                ))}
            </div>

            <div className='px-6 md:px-25 flex justify-center w-full'>
                <Link href="/catalogo" className='text-2xl font-medium hover:underline flex flex-row items-center mt-10 gap-3'>
                    Explorar Catalogo <ArrowRight/>
                </Link>
            </div>
        </div>
    ); 
}

export default PromoImg;