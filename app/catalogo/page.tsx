"use client"

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import Image from "next/image"
import { Check, Plus } from "lucide-react";
import Masonry from "react-masonry-css";
import { useCart } from "../context/CartContext";
import { calcularPrecio } from "../lib/utils";

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

interface PromoType {
  id: number
  categoria: string
  desc_tipo: string
  desc_valor: number
  comienza: string
  termina: string
  activo: boolean
}


export default function page() {

    const [modelos, setModelos] = useState<CategoriasType[] | null>(null)
    const [catSelected, setCatSelected] = useState<string>("todos")
    const [addedId, setAddedId] = useState<number | null>(null);

    const [promos, setPromos] = useState<PromoType[] | null>(null)

    const {addToCart} = useCart()

    const fetchData = async () => {

        const ahora = new Date().toISOString()

        const { data: modelosData, error: modelosError } = await supabase
            .from("modelos")
            .select("id, nombre, imagen, precio, productos (id, sabor, stock)")

        if (modelosError) console.error(modelosError)
        if (modelosData) setModelos(modelosData)

        const { data: promosData, error: promoError } = await supabase
            .from("promos")
            .select("*")
            .eq("activo", true)
            .lte("comienza", ahora)
            .gte("termina", ahora)

        if (promoError) console.error(promoError)
        if (promosData) setPromos(promosData)

    }

    useEffect(() => {
        fetchData()
    }, [])

    

    const categorias = ["todos", "vhill", "waka", "lost mary", "iplay", "elf bar", "funky", "elux", "snoopy"];

    const modFiltrados = catSelected === "todos" 
        ? modelos 
        : modelos?.filter(mod => mod.nombre.toLocaleLowerCase().includes(catSelected.toLowerCase()))


    const handleAddToCart = (prod: any, mod: any, precioFinal: any) => {
        addToCart({
            id: prod.id,
            nombre: prod.sabor,
            precio: mod.precio,
            cantidad: 1,
            imgMod: mod.imagen,
            modelo: mod.nombre,
        });

        // Activamos el feedback visual
        setAddedId(prod.id);

        // Lo quitamos después de 1.5 segundos
        setTimeout(() => {
            setAddedId(null);
        }, 1500);
    };

    return(
        <div>
            <div className="my-19">
                <div className="px-6 md:px-12 flex flex-col mb-11">
                    <h1 className="w-fit text-5xl text-(--gray) text-center">Catalogo Completo</h1>
                </div>
                <div className="w-full bg-(--pink-low) py-10 px-6 md:px-12">
                    <p className="text-xl text-(--gray) mb-4 font-medium">Busca por <span className="text-(--pink-75)">Modelo</span></p>
                    <div className="flex [&::-webkit-scrollbar]:hidden gap-4 overflow-x-auto scrollbar-hide text-sm font-medium">
                        {categorias.map((cat, id) => {
                            return <button onClick={() => setCatSelected(cat)} key={id} 
                                className={`${cat === catSelected ? "bg-(--pink) text-(--white) border-(--pink)" : "bg-(--pinkLowest)"} 
                                            border border-(--pink-35) text-(--white) px-7 py-2.5 rounded-3xl whitespace-nowrap shrink-0
                                            hover:cursor-pointer hover:text-(--pink-75) hover:border-(--pink-75)`}>
                                    {cat.toUpperCase()}
                                </button>
                        })}
                    </div>
                </div>
            </div>
            <Masonry
                breakpointCols={breakpointColumnsObj}
                className="flex w-full gap-10 md:gap-2"
                columnClassName="flex flex-col gap-10 md:gap-2 items-center"
                >
                {modFiltrados?.map(mod => {

                    const precioFinal = calcularPrecio(mod.precio, mod.nombre, promos)
                    const tienePromo = precioFinal !== mod.precio

                    return(
                        <div key={mod.id} className=" border-2 border-(--purple) rounded-2xl w-xs bg-black">
                            <div className="relative">
                                <Image 
                                src={mod.imagen} 
                                alt={mod.nombre}
                                className="object-cover rounded-t-3xl"
                                width={320}
                                height={320}
                                />
                                <div className="text-lg absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col w-fit text-center">
                                    <div className="py-1 px-3 bg-white text-black text-base font-medium">{mod.nombre.toUpperCase()}</div>
                                    {tienePromo 
                                    ? <div>
                                            <div className=" py-1 px-3 my-2 bg-(--background) text-white font-medium">
                                                <span className="line-through text-(--promo) font-normal mr-2">${mod.precio}</span> ${precioFinal}
                                            </div>
                                        </div>
                                    : <div className="py-1 px-3 my-2 bg-(--background) font-medium">
                                        ${mod.precio}
                                        </div>
                                    }
                                </div>
                            </div>

                            <div className="my-12 mx-4 flex flex-col">
                                {mod.productos.map(prod => (
                                    prod.stock > 0 && (
                                    <div key={prod.id}>
                                    <div 
                                        className="flex justify-between px-4 py-1 my-1 fondo-dark rounded-sm text-sm"
                                    >
                                        <div>{prod.sabor.toUpperCase()}</div>
                                        <button className="cursor-pointer hover:bg-(--pink-75) rounded-md" onClick={() => {
                                            handleAddToCart(prod, mod, precioFinal)
                                        }}>
                                            {addedId === prod.id
                                            ? <Check size={22} className="animate-in zoom-in" />
                                            : <Plus size={22}/>}
                                        </button>
                                    </div>
                                    <hr className="text-(--pink-15) my-2"/>
                                    </div>
                                    )
                                ))}
                            </div>
                        </div>)
                })}
            </Masonry>
        </div>
    )
}