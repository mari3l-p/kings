"use client"
import { calcularPrecioFinal, PromoType, DailyPromoType } from "../lib/utils";
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { Check, Gift, Plus, Tag, Zap } from "lucide-react";
import Masonry from "react-masonry-css";
import { useCart } from "../context/CartContext";

const breakpointColumnsObj = {
  default: 4,
  1300: 3,
  1000: 2,
  700: 1
};

interface CategoriasType {
    id: number;
    nombre: string;
    imagen: string;
    precio: number;
    productos: ProductoType[];
}

interface ProductoType {
    id: number;
    sabor: string;
    stock: number;
}

const DIAS: Record<number, string> = {
  0: "domingo", 1: "lunes", 2: "martes", 3: "miércoles",
  4: "jueves", 5: "viernes", 6: "sábado"
};

// Modelos y promos regulares: 5 minutos
// Daily promos: NO se cachean porque cambian cada día y necesitan estar frescos
const CACHE_DURATION = 5 * 60 * 1000;

function getPromoBadgeText(promoInfo: PromoType | DailyPromoType): string {
  if (promoInfo.desc_tipo === "porcentaje") return `${promoInfo.desc_valor}% OFF`;
  if (promoInfo.desc_tipo === "fijo") return `-$${promoInfo.desc_valor}`;
  if (promoInfo.desc_tipo === "pack" && promoInfo.cantidad_pack) return `${promoInfo.cantidad_pack} x $${promoInfo.desc_valor}`;
  return "PROMO";
}

// Devuelve una promo tipo "paquete" activa que incluya este modelo, si existe
function getComboPromo(modNombre: string, promos: PromoType[] | null): PromoType | null {
  if (!promos) return null;
  const ahora = new Date();
  return promos.find(p =>
    p.desc_tipo === "paquete" &&
    p.activo &&
    ahora >= new Date(p.comienza) &&
    ahora <= new Date(p.termina) &&
    p.paquete_items?.some(pi => pi.nombre.toLowerCase() === modNombre.toLowerCase())
  ) ?? null;
}

function getCache<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > CACHE_DURATION) {
      sessionStorage.removeItem(key)
      return null
    }
    return data as T
  } catch {
    return null
  }
}

function setCache(key: string, data: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }))
  } catch {}
}

export default function page() {

    const [modelos, setModelos] = useState<CategoriasType[] | null>(null)
    const [catSelected, setCatSelected] = useState<string>("todos")
    const [addedId, setAddedId] = useState<number | null>(null);
    const [promos, setPromos] = useState<PromoType[] | null>(null)
    const [dailyPromos, setDailyPromos] = useState<DailyPromoType[] | null>(null)
    const [loading, setLoading] = useState(true)

    const { addToCart } = useCart()

    const fetchData = async () => {
        const ahora = new Date().toISOString()
        const hoy = DIAS[new Date().getDay()]

        // --- Modelos (con cache) ---
        const cachedModelos = getCache<CategoriasType[]>("modelos")
        if (cachedModelos) {
            setModelos(cachedModelos)
        } else {
            const { data: modelosData, error: modelosError } = await supabase
                .from("modelos")
                .select("id, nombre, imagen, precio, productos (id, sabor, stock)")
            if (modelosError) console.error(modelosError)
            if (modelosData) {
                const sorted = modelosData.sort((a, b) => a.precio - b.precio)
                setModelos(sorted)
                setCache("modelos", sorted)
            }
        }

        // --- Promos regulares (con cache) ---
        const cachedPromos = getCache<PromoType[]>("promos")
        if (cachedPromos) {
            setPromos(cachedPromos)
        } else {
            const { data: promosData, error: promoError } = await supabase
                .from("promos")
                .select("id, nombre, categoria, desc_tipo, desc_valor, cantidad_pack, paquete_items, comienza, termina, activo")
                .eq("activo", true)
                .lte("comienza", ahora)
                .gte("termina", ahora)
            if (promoError) console.error(promoError)
            if (promosData) {
                setPromos(promosData)
                setCache("promos", promosData)
            }
        }

        // --- Daily promos (SIN cache — siempre frescos) ---
        const { data: dailyData, error: dailyError } = await supabase
            .from("daily_promos")
            .select("id, dia_semana, desc_tipo, desc_valor, cantidad_pack, nombre, modelo_id")
            .eq("dia_semana", hoy)
        if (dailyError) console.error(dailyError)
        if (dailyData) {
            setDailyPromos(dailyData)
        }

        setLoading(false)
    }

    useEffect(() => { fetchData() }, [])

    const categorias = ["todos", "vhill", "waka", "extre", "fasta", "elux", "iplay"];

    const modFiltrados = catSelected === "todos"
        ? modelos
        : modelos?.filter(mod => mod.nombre.toLocaleLowerCase().includes(catSelected.toLowerCase()));

    const handleAddToCart = (prod: ProductoType, mod: CategoriasType) => {
        addToCart({
            id: prod.id,
            nombre: prod.sabor,
            precio: mod.precio,
            cantidad: 1,
            imgMod: mod.imagen,
            modelo: mod.nombre,
            modeloId: mod.id,
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

            {loading ? (
                <div className="flex justify-center items-center py-32">
                    <div className="w-8 h-8 border-4 border-(--purple) border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <Masonry
                    breakpointCols={breakpointColumnsObj}
                    className="flex w-full gap-10 md:gap-2"
                    columnClassName="flex flex-col gap-10 md:gap-2 items-center"
                >
                    {modFiltrados?.map(mod => {
                        const { precioFinal, esPack, promoInfo, esDiaria } = calcularPrecioFinal(
                            mod.precio,
                            mod.id,
                            mod.nombre,
                            promos,
                            dailyPromos
                        )
                        const tienePromo = promoInfo !== null
                        const comboPromo = getComboPromo(mod.nombre, promos)
                        
                        // Evalúa si todos los productos de este modelo tienen stock en cero
                        const todosAgotados = mod.productos.every(prod => prod.stock === 0);

                        return (
                            <div key={mod.id} className="border-2 border-(--purple) rounded-2xl w-xs bg-black">
                                <div className="relative">
                                    <img
                                        src={mod.imagen}
                                        alt={mod.nombre}
                                        loading="lazy"
                                        decoding="async"
                                        className={`object-cover rounded-t-3xl w-full ${todosAgotados ? "opacity-50 grayscale" : ""}`}
                                        width={320}
                                        height={320}
                                    />

                                    {tienePromo && promoInfo && (
                                        <div className={`absolute top-3 left-3 flex items-center gap-1 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg
                                            ${esDiaria ? "bg-blue-500 text-black" : "bg-(--pink-75)"}`}
                                        >
                                            {esDiaria ? <Zap size={11} /> : <Tag size={11} />}
                                            {esDiaria ? "Promo del Día " : ""}{getPromoBadgeText(promoInfo)}
                                        </div>
                                    )}

                                    <div className="text-lg absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col w-fit text-center">
                                        <div className="py-1 px-3 bg-white text-black text-base font-medium whitespace-nowrap">
                                            {mod.nombre.toUpperCase()}
                                        </div>
                                        {tienePromo ? (
                                            <div className="py-1 px-3 my-2 bg-(--background) text-white font-medium whitespace-nowrap">
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

                                {comboPromo && (
                                    <div className="mx-4 mt-4 flex items-start gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2 text-xs text-green-400">
                                        <Gift size={14} className="shrink-0 mt-0.5" />
                                        <span>
                                            Arma combo con{" "}
                                            <b>
                                                {comboPromo.paquete_items
                                                    ?.filter(pi => pi.nombre.toLowerCase() !== mod.nombre.toLowerCase())
                                                    .map(pi => pi.nombre)
                                                    .join(" + ")}
                                            </b>{" "}
                                            por ${comboPromo.desc_valor}
                                        </span>
                                    </div>
                                )}

                                <div className="my-12 mx-4 flex flex-col">
                                    {todosAgotados ? (
                                        <div className="py-8 text-center bg-neutral-950 rounded-md">
                                            <span className="text-red-500 text-sm font-bold tracking-wider">
                                                AGOTADO TEMPORALMENTE
                                            </span>
                                        </div>
                                    ) : (
                                        // Si HAY AL MENOS UN sabor con stock, mostramos la lista normal
                                        mod.productos.map(prod => (
                                            <div key={prod.id}>
                                                <div className={`flex justify-between px-4 py-1 my-1 fondo-dark rounded-sm text-sm
                                                    ${prod.stock === 0 ? "opacity-50" : ""}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {prod.sabor.toUpperCase()}
                                                        {prod.stock === 0 && (
                                                            <span className="text-red-500 text-[10px] font-bold tracking-wider">
                                                                AGOTADO
                                                            </span>
                                                        )}
                                                    </div>
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
            )}
        </div>
    )
}