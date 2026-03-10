"use client"

import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

interface promoType {
    id: number;
    nombre: string;
    imagen: string;
    activo: boolean;
}

const PromoImg = () => {
    const [promos, setPromos] = useState<promoType[] | null>(null)
    const [current, setCurrent] = useState(0)

    async function getPromosActivas() {
        const ahora = new Date().toISOString();
        const { data, error } = await supabase
            .from("promos")
            .select("*")
            .eq("activo", true)
            .gt("termina", ahora)
            .lt("comienza", ahora);

        if (error) { console.error("Error cargando promos:", error); return; }
        setPromos(data);
    }

    useEffect(() => { getPromosActivas(); }, []);

    if (!promos || promos.length === 0) return null;

    const prev = () => setCurrent(i => (i === 0 ? promos.length - 1 : i - 1));
    const next = () => setCurrent(i => (i === promos.length - 1 ? 0 : i + 1));

    return (
        <div className='my-45'>
            <div className='text-5xl md:text-8xl font-semibold mb-10 text-(--background) bg-(--white) text-center py-4 uppercase'>
                Promos
            </div>

            <div className="relative flex items-center justify-center px-6 md:px-20">

                {/* Left arrow */}
                {promos.length > 1 && (
                    <button
                        onClick={prev}
                        className="absolute left-2 md:left-6 z-10 p-2 rounded-full bg-black/60 border border-white/10 hover:bg-(--pink-75) transition-all"
                    >
                        <ChevronLeft size={28} />
                    </button>
                )}

                {/* Image */}
                <div className="w-full md:w-[60%] lg:w-[40%] overflow-hidden rounded-xl">
                    <img
                        key={promos[current].id}
                        src={promos[current].imagen}
                        alt={promos[current].nombre}
                        className="w-full h-auto object-cover rounded-xl transition-opacity duration-300"
                    />
                </div>

                {/* Right arrow */}
                {promos.length > 1 && (
                    <button
                        onClick={next}
                        className="absolute right-2 md:right-6 z-10 p-2 rounded-full bg-black/60 border border-white/10 hover:bg-(--pink-75) transition-all"
                    >
                        <ChevronRight size={28} />
                    </button>
                )}
            </div>

            {/* Dots */}
            {promos.length > 1 && (
                <div className="flex justify-center gap-2 mt-5">
                    {promos.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`rounded-full transition-all ${
                                i === current
                                    ? "bg-(--pink-75) w-5 h-2"
                                    : "bg-white/20 w-2 h-2"
                            }`}
                        />
                    ))}
                </div>
            )}

            <div className='px-6 md:px-25 flex justify-center w-full'>
                <Link href="/catalogo" className='text-2xl font-medium hover:underline flex flex-row items-center mt-10 gap-3'>
                    Explorar Catalogo <ArrowRight />
                </Link>
            </div>
        </div>
    );
}

export default PromoImg;