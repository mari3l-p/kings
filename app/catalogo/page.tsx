"use client"
import { calcularPrecio, PromoType } from "../lib/utils";
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import Image from "next/image"
import { Check, Plus, Tag } from "lucide-react";
import Masonry from "react-masonry-css";
import { useCart } from "../context/CartContext";

const breakpointColumnsObj = {
  default: 4,
  1300: 3,
  1000: 2,
  700: 1
};

interface CategoriasType {
    id: number,
    nombre: string,
    imagen: string,
    precio: number,
    productos: ProductoType[];
}

interface ProductoType {
    id: number;
    sabor: string;
    stock: number;
}

function getPromoBadgeText(promoInfo: PromoType): string {
  if (promoInfo.desc_tipo === "porcentaje") return `${promoInfo.desc_valor}% OFF`;
  if (promoInfo.desc_tipo === "fijo") return `-$${promoInfo.desc_valor}`;
  if (promoInfo.desc_tipo === "pack" && promoInfo.cantidad_pack) return `${promoInfo.cantidad_pack} x $${promoInfo.desc_valor}`;
  return "PROMO";
}

export default function page() {

    const [modelos, setModelos] = useState<CategoriasType[] | null>(null)
    const [catSelected, setCatSelected] = useState<string>("todos")
    const [addedId, setAddedId] = useState<number | null>(null);
    const [promos, setPromos] = useState<PromoType[] | null>(null)

    const { addToCart } = useCart()

    const fetchData = async () => {
        const ahora = new Date().toISOString()

        const { data: modelosData, error: modelosError } = await supabase
            .from("modelos")
            .select("id, nombre, imagen, precio, productos (id, sabor, stock)")

        if (modelosError) console.error(modelosError)
        if (modelosData) {
            const sorted = modelosData.sort((a, b) => a.precio - b.precio)
            setModelos(sorted)
        }

        const { data: promosData, error: promoError } = await supabase
            .from("promos")
            .select("*")
            .eq("activo", true)
            .lte("comienza", ahora)
            .gte("termina", ahora)

        if (promoError) console.error(promoError)
        if (promosData) setPromos(promosData)
    }

    useEffect(() => { fetchData() }, [])

    const categorias = ["todos", "vhill", "waka", "lost mary", "fasta", "iplay", "elf bar", "funky", "elux", "snoopy"];

    const modFiltrados = catSelected === "todos"
        ? modelos
        : modelos?.filter(mod => mod.nombre.toLocaleLowerCase().includes(catSelected.toLowerCase()))

    const handleAddToCart = (prod: ProductoType, mod: CategoriasType) => {
        addToCart({
            id: prod.id,
            nombre: prod.sabor,
            precio: mod.precio,
            cantidad: 1,
            imgMod: mod.imagen,
            modelo: mod.nombre,
        });
        setAddedId(prod.id);
        setTimeout(() => setAddedId(null), 1500);
    };

    return (
        <div>
            <div className="my-19">
                <div className="px-6 md:px-12 flex flex-col mb-11">
                    <h1 className="w-fit text-5xl text-(--gray) text-center">Catalogo Completo</h1>
                </div>
                <div className="w-full bg-(--pink-low) py-10 px-6 md:px-12">
                    <p className="text-xl text-(--gray) mb-4 font-medium">
                        Busca por <span className="text-(--pink-75)">Modelo</span>
                    </p>
                    <div className="flex [&::-webkit-scrollbar]:hidden gap-4 overflow-x-auto scrollbar-hide text-sm font-medium">
                        {categorias.map((cat, id) => (
                            <button
                                onClick={() => setCatSelected(cat)}
                                key={id}
                                className={`${cat === catSelected
                                    ? "bg-(--pink) text-(--white) border-(--pink)"
                                    : "bg-(--pinkLowest)"}
                                    border border-(--pink-35) text-(--white) px-7 py-2.5 rounded-3xl whitespace-nowrap shrink-0
                                    hover:cursor-pointer hover:text-(--pink-75) hover:border-(--pink-75)`}
                            >
                                {cat.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <Masonry
                breakpointCols={breakpointColumnsObj}
                className="flex w-full gap-10 md:gap-2"
                columnClassName="flex flex-col gap-10 md:gap-2 items-center"
            >
                {modFiltrados?.map(mod => {
                    const { precioFinal, esPack, promoInfo } = calcularPrecio(mod.precio, mod.nombre, promos)
                    const tienePromo = promoInfo !== null

                    // ✅ Check if ALL products are out of stock
                    const todoAgotado = mod.productos.every(p => p.stock === 0)

                    return (
                        <div key={mod.id} className="border-2 border-(--purple) rounded-2xl w-xs bg-black">
                            <div className="relative">
                                <Image
                                    src={mod.imagen}
                                    alt={mod.nombre}
                                    className="object-cover rounded-t-3xl"
                                    width={320}
                                    height={320}
                                />

                                {/* Promo badge top-left */}
                                {tienePromo && promoInfo && (
                                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-(--pink-75) text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
                                        <Tag size={11} />
                                        {getPromoBadgeText(promoInfo)}
                                    </div>
                                )}

                                {/* Bottom-center price badge */}
                                <div className="text-lg absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col w-fit text-center">
                                    <div className="py-1 px-3 bg-white text-black text-base font-medium">
                                        {mod.nombre.toUpperCase()}
                                    </div>
                                    {tienePromo ? (
                                        <div className="py-1 px-3 my-2 bg-(--background) text-white font-medium">
                                            {esPack && promoInfo
                                                ? `${promoInfo.cantidad_pack} x $${promoInfo.desc_valor}`
                                                : `$${precioFinal}`
                                            }
                                        </div>
                                    ) : (
                                        <div className="py-1 px-3 my-2 bg-(--background) font-medium">
                                            ${mod.precio}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="my-12 mx-4 flex flex-col">
                                {/* ✅ If ALL products are out of stock, show one single AGOTADO */}
                                {todoAgotado ? (
                                    <p className="text-center text-red-500 text-xs font-semibold tracking-widest py-2">
                                        AGOTADO
                                    </p>
                                ) : (
                                    mod.productos.map(prod => (
                                        <div key={prod.id}>
                                            <div className={`flex justify-between px-4 py-1 my-1 fondo-dark rounded-sm text-sm
                                                ${prod.stock === 0 ? "opacity-50" : ""}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {prod.sabor.toUpperCase()}
                                                    {/* ✅ Show AGOTADO inline next to flavor name */}
                                                    {prod.stock === 0 && (
                                                        <span className="text-red-500 text-[10px] font-bold tracking-wider">
                                                            AGOTADO
                                                        </span>
                                                    )}
                                                </div>
                                                {/* ✅ Only show add button if in stock */}
                                                {prod.stock > 0 && (
                                                    <button
                                                        className="cursor-pointer hover:bg-(--pink-75) rounded-md"
                                                        onClick={() => handleAddToCart(prod, mod)}
                                                    >
                                                        {addedId === prod.id
                                                            ? <Check size={22} className="animate-in zoom-in" />
                                                            : <Plus size={22} />
                                                        }
                                                    </button>
                                                )}
                                            </div>
                                            <hr className="text-(--pink-15) my-2" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )
                })}
            </Masonry>
        </div>
    )
}