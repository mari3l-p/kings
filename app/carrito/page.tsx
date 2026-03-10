"use client"

import Image from "next/image";
import { useCart } from "../context/CartContext";
import { ChevronLeft, MessageCircle, Minus, Phone, Plus, ShoppingBag, Square, SquareCheck, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import MapSelector from "../components/UbicacionExacta";
import MsgSend from "../components/MsgSend";
import { supabase } from "../lib/supabase";
import { calcularPrecio } from "../lib/utils";

interface CarritoProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface FormData {
    entrega: string;
    pago: string[];  // Explicitly type as string array
    nombre: string;
    telefono: string;
    direccion: string;
    location: LocationData
}

interface LocationData {
  lat: number;
  lng: number;
}

export default function Carrito({ isOpen, setIsOpen }: CarritoProps) {
    const {cart, removeFromCart, addToCart, restToCart} = useCart()

    const [step, setStep] = useState<number>(1)
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        entrega: "domicilio",
        pago: ["efectivo"] as string[],
        nombre: "",
        telefono: "",
        direccion: "",
        location: {lat: 0, lng: 0}
    });

    const total = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    const vapesSelect = cart.reduce((acc, item) => (acc + item.cantidad), 0)

    const handleTogglePago = (metodo: string) => {
    const pagoActual = formData.pago; // Es tu array []
    
    const nuevaLista = pagoActual.includes(metodo)
        ? pagoActual.filter((item) => item !== metodo) // Si ya está, lo borramos
        : [...pagoActual, metodo];                    // Si no está, lo sumamos

    setFormData({ ...formData, pago: nuevaLista });
};

    const handleLocationChange = (coords: { lat: number; lng: number }) => {
    setFormData({
        ...formData,
        location: coords
    })
    }

const [promos, setPromos] = useState<any[] | null>(null);

// 2. Cargar las promos al abrir el carrito
useEffect(() => {
    const fetchPromos = async () => {
        const ahora = new Date().toISOString();
        const { data } = await supabase
            .from("promos")
            .select("*")
            .eq("activo", true)
            .lte("comienza", ahora)
            .gte("termina", ahora);
        setPromos(data);
    };
    if (isOpen) fetchPromos(); // Solo carga si el carrito está abierto
}, [isOpen]);


const validateForm = () => {

  if (!formData.nombre.trim()) {
    
    return false
  }

  if (!formData.telefono.trim()) {
    
    return false
  }

  if (formData.telefono.length < 10) {
    
    return false
  }

  if (formData.entrega === "domicilio" && !formData.direccion.trim()) {
    
    return false
  }

  if (formData.pago.length === 0) {
    
    return false
  }

  return true
}

const sendOrderToWhatsapp = () => {
  const isValid = validateForm();
  if (!isValid) return;

  const locationLink = formData.location?.lat
    ? `https://www.google.com/maps?q=${formData.location.lat},${formData.location.lng}`
    : "No compartida";

  const message = `
*Nuevo Pedido*
-------------------------
${cart.map(item => `
*${item.modelo.toUpperCase()}*
  - (${item.cantidad}) ${item.nombre.toUpperCase()}
`).join("")}

TOTAL: *$${total}*
Orden de ${vapesSelect} Vapes

-------------------------

Nombre: ${formData.nombre}
Teléfono: ${formData.telefono}
${formData.entrega === "domicilio" ? `
Dirección: ${formData.direccion}
Ubicación: ${locationLink}` : ""}

Entrega: ${formData.entrega.toUpperCase()}
Pago: ${formData.pago}
`.trim(); // El .trim() quita espacios en blanco innecesarios al inicio y final

  const encodedMessage = encodeURIComponent(message);
  const phone = "529671844575";
  const url = `https://wa.me/${phone}?text=${encodedMessage}`;

  window.open(url, "_blank");
}


const sendOrder = () => {
    const isValid = validateForm();
    if (!isValid) return;

    // 1. Enviamos a WhatsApp
    sendOrderToWhatsapp();
    
    // 2. Guardamos en la base de datos (Admin)
    handleGenerarOrden();
    
    // 3. Mostramos el modal de éxito
    setShowModal(true);
}
const handleGenerarOrden = async () => {

    const itemsToInsert = cart.map(item => ({
            nombre_cliente: formData.nombre,
            telefono: formData.telefono,
            total: item.precio * item.cantidad,
            productos: item.id, // This links to 'id' in your screenshot
            estatus: "pendiente",
        }));

    const {data, error} = await supabase
        .from("ordenes")
        .insert(itemsToInsert)

    if (error) console.error(error);
}

    return(
        <>
            {/* El Carrito (Contenedor principal) */}
                <div className={`fixed top-0 right-0 h-full z-100 transition-transform duration-300 transform 
                    ${isOpen ? "translate-x-0" : "translate-x-full"} 
                    w-full md:w-100 bg-black border-l border-(--pink-75) flex flex-col shadow-2xl shadow-pink-500/20`}>
                    
                    {/* Header del Carrito con botón de cerrar grande para pulgares */}
                    <div className="flex justify-between items-center p-6 border-b border-white/10">
                        <div className="flex">
                            {step === 1 ? <ShoppingBag size={24} className="text-(--pink-75)"/> : <button onClick={() => setStep(1)}><ChevronLeft /></button>}
                            <div className="ml-3">
                                <h2 className="text-xl font-medium">{step === 1 ? "Mi Carrito" : "Finalizar Pedido"}</h2>
                                <p className="text-xs text-(--gray)">{step === 1 ? `${vapesSelect} Vapes seleccionados` : "Completa los datos de entrega"}</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X size={28}/>
                        </button>
                    </div>

                    {step === 1 
                        ? (
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                                {cart.length === 0 ? (
                                    <div className="text-center mt-20">
                                        <p className="text-gray-400 mb-4">Tu carrito está vacío.</p>
                                        <button onClick={() => setIsOpen(false)} className="text-(--pink) text-lg cursor-pointer underline">
                                            Seguir comprando
                                        </button>
                                    </div>
                                ) : 
                                    cart.map(item => {
                                        // 1. AQUÍ pones la lógica antes del return
                                        const precioActual = calcularPrecio(item.precio, item.modelo, promos);
                                        const tienePromo = precioActual !== item.precio;

                                        return (
                                            // 2. Usamos el key en el Fragment o en el div principal
                                            <div key={item.id} className="flex justify-between animate-in fade-in slide-in-from-right-4 border border-(--pink-35) p-5 rounded-2xl">
                                                <div className="flex">
                                                    <Image src={item.imgMod} alt={item.nombre} width={90} height={50} className="rounded-md" />
                                                    <div className="ml-5">
                                                        <div>
                                                            <p className="font-medium">{item.modelo.toUpperCase()}</p>
                                                            <p className="font-bold text-(--pink) text-sm">{item.nombre.toUpperCase()}</p>
                                                            
                                                            {/* 3. Reemplazamos el precio estático por el dinámico */}
                                                            <div className="mt-1 text-sm">
                                                                {tienePromo ? (
                                                                    <p>
                                                                        <span className="line-through text-(--promo) mr-2">${item.precio}</span>
                                                                        <span className="">${precioActual}</span>
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-(--gray)">${item.precio}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="text-xl bg-(--gray-bg) flex justify-between w-25 rounded-sm mt-4">
                                                            <button onClick={() => restToCart(item)} className="cursor-pointer hover:bg-white/10 rounded-lg transition-colors"><Minus size={24}/></button>
                                                            {item.cantidad}
                                                            <button onClick={() => addToCart(item)} className="cursor-pointer hover:bg-white/10 rounded-lg transition-colors"><Plus size={24}/></button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <button onClick={() => removeFromCart(item.id)} className="text-red-500/70 h-fit p-2 hover:bg-white/10 rounded-full transition-colors">
                                                        <Trash2 size={18}/>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                
                            </div>
                        ) 
                        : (
                                <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] space-y-6 animate-in fade-in slide-in-from-right-4 p-8">
                                    <div className="space-y-4 text-sm">
                                        <div className="mb-8">
                                            <h3>MÉTODO DE ENTREGA</h3>
                                            <div className="flex border border-(--pink-35) w-fit px-2 py-1 rounded-lg mt-3 bg-white/5 ">
                                                <button onClick={() => setFormData({...formData, entrega: "domicilio"})}>
                                                    <div className={`px-3 py-1 rounded-sm text-(--gray-light) ${formData.entrega === "domicilio" && "bg-(--pink-35) text-white"}`}>Envío a Domicilio</div>
                                                </button>
                                                
                                                <button onClick={() => setFormData({...formData, entrega: "recoger"})}>
                                                    <div className={`px-3 py-1 rounded-sm text-(--gray-light) ${formData.entrega === "recoger" && "bg-(--pink-35) text-white"}`}>Recoger en Tienda</div>
                                                </button>
                                                
                                            </div>
                                        </div>

                                        <div className="mb-8">
                                            <h3>FORMA DE PAGO</h3>
                                            <div className="mt-3 flex flex-row gap-4">
                                                {/* BOTÓN EFECTIVO */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleTogglePago("efectivo")}
                                                    className={`w-28 flex flex-col items-center p-3 border rounded-xl transition-all ${
                                                        formData.pago.includes("efectivo") 
                                                        ? "border-(--pink-35) bg-(--pink)/10 text-white" 
                                                        : "border-white/10 text-(--gray-light)"
                                                    }`}
                                                >
                                                    {formData.pago.includes("efectivo") ? <SquareCheck className="text-(--pink) mb-1"/> : <Square className="mb-1"/>}
                                                    <span className="text-xs uppercase">Efectivo</span>
                                                </button>

                                                {/* BOTÓN TRANSFERENCIA */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleTogglePago("transferencia")}
                                                    className={`w-28 flex flex-col items-center p-3 border rounded-xl transition-all ${
                                                        formData.pago.includes("transferencia") 
                                                        ? "border-(--pink-35) bg-(--pink)/10 text-white" 
                                                        : "border-white/10 text-(--gray-light)"
                                                    }`}
                                                >
                                                    {formData.pago.includes("transferencia") ? <SquareCheck className="text-(--pink) mb-1"/> : <Square className="mb-1"/>}
                                                    <span className="text-xs uppercase">Transf.</span>
                                                </button>

                                                {/* BOTÓN TARJETA */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleTogglePago("tarjeta")}
                                                    className={`w-28 flex flex-col items-center p-3 border rounded-xl transition-all ${
                                                        formData.pago.includes("tarjeta") 
                                                        ? "border-(--pink-35) bg-(--pink)/10 text-white" 
                                                        : "border-white/10 text-(--gray-light)"
                                                    }`}
                                                >
                                                    {formData.pago.includes("tarjeta") ? <SquareCheck className="text-(--pink) mb-1"/> : <Square className="mb-1"/>}
                                                    <span className="text-xs uppercase">Tarjeta</span>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="mb-8">
                                            <h3>QUIÉN RECIBE EL PEDIDO</h3>
                                            <input 
                                                type="text" 
                                                placeholder="Escribe tu nombre"
                                                className="mt-3 w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-(--pink-75)"
                                                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                            />
                                        </div>

                                        <div className="mb-8">
                                            <h3>NÚMERO DE CONTACTO</h3>
                                                <label className="mt-3 flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3.5 rounded-xl 
                                                    cursor-text transition-all duration-300
                                                    focus-within:border-(--pink-75) focus-within:bg-white/10 focus-within:shadow-[0_0_15px_rgba(236,72,153,0.1)]">
                                    
                                                    {/* Icono de Teléfono */}
                                                    <Phone 
                                                    size={20} 
                                                    className={`transition-colors duration-300 ${
                                                        formData.telefono.length > 0 ? "text-(--pink-75)" : "text-(--gray-light)"
                                                    }`} 
                                                    />
                                                    <input
                                                        type="tel"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        placeholder="Ej: 9611234567"
                                                        value={formData.telefono}
                                                        className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-(--gray-light) text-sm py-1"
                                                        onChange={(e) =>
                                                            setFormData({
                                                            ...formData,
                                                            telefono: e.target.value.replace(/\D/g, "")
                                                            })
                                                        }
                                                        />
                                                </label>
                                        </div>

                                        {formData.entrega === "domicilio" ? 
                                        <>
                                            <div className="mb-8">
                                            <h3>DIRECCIÓN DE ENTREGA</h3>
                                            <textarea rows={6}
                                                onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                                                placeholder="Ej: Calle, número exterior/interior y colonia..."
                                                className="mt-3 w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-(--pink-75)"
                                            >

                                            </textarea>
                                        </div>

                                        <div>
                                                <h2>Ubicación exacta (opcional)</h2>
                                                <MapSelector onLocationChange={handleLocationChange}/>
                                        </div>
                                        </> : <></>}
                                    </div>
                                </div>
                        )}

                    {/* Footer fijo del carrito - Resumen y Botón WhatsApp */}
                    <div className="p-6 bg-zinc-950 border-t border-white/10 space-y-4 pb-10 md:pb-6">
                        <div className="flex justify-between items-end">
                            <span className="text-gray-400 text-sm">{step === 1 ? "Subtotal" : "Total (Envio Incluido)"}:</span>
                            <span className="text-xl font-medium">${step === 1 ? total : total + 40}</span>
                        </div>
                        
                        {/* Botón de acción principal */}
                            {step === 1 
                            ? <button 
                                disabled={cart.length === 0}
                                onClick={() => setStep(2)}
                                className="w-full bg-(--pink-75) hover:bg-(--pink) text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed"
                            >
                                Continuar con el pedido
                            </button> 
                            : <button
                            disabled={!validateForm()}
                                onClick={() => sendOrder()}
                                className="w-full flex justify-center gap-2 bg-(--green) hover:bg-(--green) text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed"
                            >
                                <MessageCircle/> Enviar a WhatsApp
                            </button> }
                            
                            <MsgSend 
                                isOpen={showModal} 
                                onClose={() => setShowModal(false)} 
                            />
                    </div>
                </div>
        </>


    )
}