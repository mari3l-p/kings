"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { X } from "lucide-react"

export default function PromoPopup() {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        // Espera 1 segundo y luego muestra el popup
        const timer = setTimeout(() => {
            setIsOpen(true)
        }, 5000)
        return () => clearTimeout(timer)
    }, [])

    if (!isOpen) return null

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpen(false)} // click fuera cierra
        >
            <div 
                className="relative w-[90%] max-w-sm rounded-2xl overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()} // evita que click interno cierre
            >
                {/* Botón cerrar */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-3 right-3 z-10 bg-black/60 hover:bg-black rounded-full p-1 transition"
                >
                    <X size={20} className="text-white" />
                </button>

                {/* Imagen del flyer */}
                <Image
                    src="/18.png"
                    alt="Recomienda y Gana"
                    width={500}
                    height={700}
                    className="w-full h-auto"
                />
            </div>
        </div>
    )
}