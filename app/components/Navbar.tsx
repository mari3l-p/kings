"use client"

import { Search, ShoppingCart, Menu, Crown } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import Carrito from '../carrito/page';
import { useCart } from '../context/CartContext';

export default function Navbar() {

    const [isCartOpen, setIsCartOpen] = useState(false);
    const {cart} = useCart()

    const vapesCount = cart.reduce((acc, item) => (acc + item.cantidad), 0)

    const phone = "529671844575"; // El número de tu tienda
    const message = "¡Hola! Tengo una duda sobre los vapes.";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    return(
        <nav className='flex justify-between px-6 md:px-12 pt-15 pb-5 border-b border-b-(--pink-50) sticky top-0 bg-black z-50'>

            <Link href={"/"} className='flex items-center gap-3'>
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tighter italic">
                        THE VAPE KINGS
                    </h2>
                    <p className='text-xs'>Experiencia premium</p>
                </div>
            </Link>

            <div className='flex items-center gap-5 lg:gap-2'>
                <button 
                    onClick={() => setIsCartOpen(true)}
                    className='relative lg:p-3 hover:bg-white/10 rounded-full'
                >
                    <ShoppingCart />
                    <div className='absolute top-[-13] right-[-14] lg:top-[-2] lg:right-[-4] w-5 h-5 text-sm flex justify-center items-center bg-red-800 rounded-full font-bold'>{vapesCount}</div>
                </button>
                <button className='lg:p-3 hover:bg-white/10 rounded-full'>
                    <a href={url} target='_blank'>
                        <img 
                        src="https://cdn.simpleicons.org/whatsapp/ffffff" 
                        alt="WhatsApp" 
                        className="w-7 h-7" 
                    />
                    </a>
                </button>
            </div>

            <Carrito isOpen={isCartOpen} setIsOpen={setIsCartOpen} />
        </nav>
    )
}