"use client"

import { createContext, useContext, useEffect, useState } from "react"

type CartItem = {
    id: number,
    nombre: string,
    precio: number,
    cantidad: number,
    imgMod: string,
    modelo: string,
    modeloId: number,
}

// ✅ What we actually save to localStorage — no precio
type StoredCartItem = {
    id: number,
    nombre: string,
    cantidad: number,
    imgMod: string,
    modelo: string,
    modeloId: number,
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

    // Load from localStorage — rehydrate prices from DB on every load
    useEffect(() => {
        const stored = localStorage.getItem("cart")
        if (!stored) return

        const storedItems: StoredCartItem[] = JSON.parse(stored)
        if (storedItems.length === 0) return

        // ✅ Fetch fresh prices for stored product IDs
        const rehydrate = async () => {
            const ids = storedItems.map(i => i.id)

            const { data, error } = await (await import("../lib/supabase"))
                .supabase
                .from("productos")
                .select("id, precio:modelos(precio)")
                .in("id", ids)

            if (error || !data) {
                // If fetch fails, clear cart to avoid stale data
                localStorage.removeItem("cart")
                return
            }

            // Merge fresh prices into stored items
            const rehydrated: CartItem[] = storedItems.map(stored => {
                const fresh = data.find((d: any) => d.id === stored.id)
                const precio = fresh?.precio?.[0]?.precio ?? 0
                return { ...stored, precio }
            }).filter(item => item.precio > 0) // remove items no longer in DB

            setCart(rehydrated)
        }

        rehydrate()
    }, [])

    // ✅ Save to localStorage WITHOUT precio
    useEffect(() => {
        const toStore: StoredCartItem[] = cart.map(({ precio, ...rest }) => rest)
        localStorage.setItem("cart", JSON.stringify(toStore))
    }, [cart])

    const addToCart = (item: CartItem) => {
        setCart(prev => {
            const existing = prev.find(p => p.id === item.id)
            if (existing) {
                return prev.map(p =>
                    p.id === item.id
                        ? { ...p, cantidad: p.cantidad + 1 }
                        : p
                )
            }
            return [...prev, item]
        })
    }

    const restToCart = (item: CartItem) => {
        setCart(prev => {
            const existing = prev.find(p => p.id === item.id)
            if (existing && existing.cantidad > 1) {
                return prev.map(p =>
                    p.id === item.id
                        ? { ...p, cantidad: p.cantidad - 1 }
                        : p
                )
            }
            return prev.filter(p => p.id !== item.id)
        })
    }

    const removeFromCart = (id: number) => {
        setCart(prev => prev.filter(p => p.id !== id))
    }

    const resetCart = () => {
        setCart([])
        localStorage.removeItem("cart")
    }

    return (
        <CartContext.Provider value={{ cart, addToCart, restToCart, removeFromCart, resetCart }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) throw new Error("useCart must be used inside CartProvider")
    return context
}