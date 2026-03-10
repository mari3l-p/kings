"use client"

import { createContext, useContext, useEffect, useState } from "react"

type CartItem = {
    id: number,
    nombre: string,
    precio: number,
    cantidad: number,
    imgMod: string,
    modelo: string,
}

type CartContextType = {
    cart: CartItem[],
    addToCart: (item: CartItem) => void,
    restToCart: (item: CartItem) => void,
    removeFromCart: (id: number) => void,
    resetCart: () => void,
}

const CartContext = createContext<CartContextType | undefined>(undefined)


export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([])

    // Load from localStorage
    useEffect(() => {
        const stored = localStorage.getItem("cart")
        if(stored) {
            setCart(JSON.parse(stored))
        }
    }, [])


    // Update changes to localStorage
    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cart))
    }, [cart])


    const addToCart = (item: CartItem) => {
        setCart(prev => {
            const existing = prev.find(p => p.id === item.id)

            if (existing) {
                return prev.map(p =>
                    p.id === item.id 
                        ? {...p, cantidad: p.cantidad + 1}
                        : p
                )
            }

            return [...prev, item]
        })
    }

    const restToCart = (item: CartItem) => {
    setCart(prev => {
        const existing = prev.find(p => p.id === item.id);

        // Si el producto existe y la cantidad es mayor a 1, restamos
        if (existing && existing.cantidad > 1) {
            return prev.map(p =>
                p.id === item.id 
                    ? { ...p, cantidad: p.cantidad - 1 } 
                    : p
            );
        }
        
        // Si la cantidad es 1 y vuelven a restar, lo borramos del carrito
        return prev.filter(p => p.id !== item.id);
    });
};

    const removeFromCart = (id : number) => {
        setCart(prev => prev.filter(p => p.id !== id))
    }

    const resetCart = () => {
        setCart([])
    }


    return(
        <CartContext.Provider value={{cart, addToCart, restToCart, removeFromCart, resetCart}}>
            {children}
        </CartContext.Provider>
    )
}



export function useCart() {
    const context = useContext(CartContext)

    if(!context) {
        throw new Error("useCart must be used inside CartProvider")
    }

    return context
}