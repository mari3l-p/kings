"use client"

import Link from 'next/link'
import { MessageCircle, MapPin} from 'lucide-react'

const Footer = () => {
    return (
        <footer className="bg-black border-t border-white/10 pt-16 pb-8 mt-10">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
                
                {/* 1. Branding y Eslogan */}
                <div className="col-span-1 md:col-span-1">
                    <h2 className="text-2xl font-bold text-white tracking-tighter mb-4 italic">
                        THE VAPE KINGS
                    </h2>
                    <p className="text-gray-300 text-sm leading-relaxed uppercase tracking-tighter">
                        Calidad premium en cada calada. Los mejores vapes y sabores en Mérida.
                    </p>
                </div>

                {/* 2. Navegación Rápida */}
                <div>
                    <h3 className="text-white font-bold mb-6 uppercase text-xs tracking-[0.2em]">Explorar</h3>
                    <ul className="space-y-4 text-gray-400 text-sm">
                        <li>
                            <Link href="/" className="hover:text-(--pink-75) transition-colors">Inicio</Link>
                        </li>
                        <li>
                            <Link href="/catalogo" className="hover:text-(--pink-75) transition-colors">Catálogo Completo</Link>
                        </li>
                        {/* Botón de Admin discreto */}
                        <div className="mt-8 md:mt-0">
                            <Link 
                                href="/admin" 
                                className="flex items-center gap-2 text-gray-500 hover:text-(--pink-75) transition-colors uppercase tracking-[0.3em] font-bold group"
                            >
                                Panel Admin
                            </Link>
                        </div>
                    </ul>
                </div>

                {/* 3. Soporte y Contacto */}
                <div>
                    <h3 className="text-white font-bold mb-6 uppercase text-xs tracking-[0.2em]">Ubicación</h3>
                    <ul className="space-y-4 text-gray-400 text-sm">
                        <li className="flex items-center gap-2 text-balance">
                            <MapPin size={14} className="text-(--pink-75)"/> Mérida, Yucatán, México.
                        </li>
                    </ul>
                </div>

                {/* 4. Redes y Admin */}
                <div className="flex flex-col justify-between">
                    <div>
                        <h3 className="text-white font-bold mb-6 uppercase text-xs tracking-[0.2em]">Social</h3>
                        <div className="flex gap-4">
                            <a href="https://wa.me/529671844575" target='_blank' className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-[#25D366] transition-all">
                                <MessageCircle size={20} className="text-white"/>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest">
                    © 2026 THE VAPE KINGS - Todos los derechos reservados.
                </p>
                <div className="flex gap-6">
                    <span className="text-[10px] text-gray-600">EFECTIVO</span>
                    <span className="text-[10px] text-gray-600">TRANSFERENCIA</span>
                    <span className="text-[10px] text-gray-600">TARJETA</span>
                </div>
            </div>
        </footer>
    )
}

export default Footer