"use client"

import { useCart } from "../context/CartContext";
import { ChevronLeft, MessageCircle, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import MapSelector from "../components/UbicacionExacta";
import MsgSend from "../components/MsgSend";
import { supabase } from "../lib/supabase";
import { calcularPrecio, PromoType } from "../lib/utils";

interface CarritoProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface CartItem {
  id: number;
  nombre: string;
  modelo: string;
  precio: number;
  cantidad: number;
  imgMod: string;
  imagen?: string;
}

export default function Carrito({ isOpen, setIsOpen }: CarritoProps) {
  const { cart, removeFromCart, addToCart, restToCart } = useCart();
  const [step, setStep] = useState<number>(1);
  const [showModal, setShowModal] = useState(false);
  const [promos, setPromos] = useState<any[] | null>(null);

  const [formData, setFormData] = useState({
    entrega: "domicilio",
    pago: ["efectivo"] as string[],
    nombre: "",
    telefono: "",
    direccion: "",
    location: { lat: 0, lng: 0 },
  });

  useEffect(() => {
    const fetchPromos = async () => {
      const ahora = new Date().toISOString();
      const { data } = await supabase
        .from("promos")
        .select("*")
        .eq("activo", true)
        .lte("comienza", ahora)
        .gte("termina", ahora);
      setPromos(data ?? []);
    };
    if (isOpen) fetchPromos();
  }, [isOpen]);

  // Total quantity per modelo
  const cantidadPorModelo: Record<string, number> = cart.reduce((acc, item) => {
    const key = item.modelo.toLowerCase();
    acc[key] = (acc[key] || 0) + item.cantidad;
    return acc;
  }, {} as Record<string, number>);

  // ✅ Correct total: use calcularPrecio with full modelo quantity (already handles packs + leftovers correctly)
  const total = cart.reduce((acc, item) => {
    const totalCantidadModelo = cantidadPorModelo[item.modelo.toLowerCase()];
    const { precioFinal } = calcularPrecio(item.precio, item.modelo, promos, totalCantidadModelo);
    // Only add once per modelo (for the first item of each modelo)
    const itemsDeEsteModelo = cart.filter(i => i.modelo.toLowerCase() === item.modelo.toLowerCase());
    if (itemsDeEsteModelo[0].id === item.id) {
      return acc + Number(precioFinal);
    }
    return acc;
  }, 0);

  const vapesSelect = cart.reduce((acc, item) => acc + item.cantidad, 0);

  const handleTogglePago = (metodo: string) => {
    const nuevaLista = formData.pago.includes(metodo)
      ? formData.pago.filter((item) => item !== metodo)
      : [...formData.pago, metodo];
    setFormData({ ...formData, pago: nuevaLista });
  };

  const handleLocationChange = (coords: { lat: number; lng: number }) => {
    setFormData({ ...formData, location: coords });
  };

  const validateForm = () => {
    if (!formData.nombre.trim()) return false;
    if (!formData.telefono.trim() || formData.telefono.length < 10) return false;
    if (formData.entrega === "domicilio" && !formData.direccion.trim()) return false;
    if (formData.pago.length === 0) return false;
    return true;
  };

  const sendOrderToWhatsapp = () => {
    if (!validateForm()) return;
    const locationLink = formData.location?.lat
      ? `https://www.google.com/maps?q=${formData.location.lat},${formData.location.lng}`
      : "No compartida";
    const envio = formData.entrega === "domicilio" ? 40 : 0;
    const message = `
*Nuevo Pedido*
-------------------------
${cart.map((item) => `
*${item.modelo.toUpperCase()}*
  - (${item.cantidad}) ${item.nombre.toUpperCase()}`).join("")}

TOTAL: *$${Math.round(total + envio)}*
Orden de ${vapesSelect} Vapes

-------------------------
Nombre: ${formData.nombre}
Teléfono: ${formData.telefono}
${formData.entrega === "domicilio" ? `\nDirección: ${formData.direccion}\nUbicación: ${locationLink}` : ""}

Entrega: ${formData.entrega.toUpperCase()}
Pago: ${formData.pago.join(", ")}
`.trim();
    window.open(`https://wa.me/529671614636?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleGenerarOrden = async () => {
    const itemsToInsert = cart.map((item) => {
      const totalCantidadModelo = cantidadPorModelo[item.modelo.toLowerCase()];
      const { precioFinal } = calcularPrecio(item.precio, item.modelo, promos, totalCantidadModelo);
      const precioProrrateado = Math.round((Number(precioFinal) / totalCantidadModelo) * item.cantidad);
      return {
        nombre_cliente: formData.nombre,
        telefono: formData.telefono,
        total: precioProrrateado,
        productos: item.id,
        estatus: "pendiente",
      };
    });
    const { error } = await supabase.from("ordenes").insert(itemsToInsert);
    if (error) console.error(error);
  };

  const sendOrder = () => {
    if (!validateForm()) return;
    sendOrderToWhatsapp();
    handleGenerarOrden();
    setShowModal(true);
  };

  const envio = formData.entrega === "domicilio" ? 40 : 0;

  // ✅ Helper: given a cart item, how many of its units are "in pack" vs "leftover"
  const getItemPackInfo = (item: CartItem, promoInfo: PromoType, totalModelo: number) => {
    const packSize = promoInfo.cantidad_pack ?? 2;
    const totalPacks = Math.floor(totalModelo / packSize);
    const totalEnPack = totalPacks * packSize;
    const totalSobrantes = totalModelo % packSize;

    // Walk through cart items of this modelo in order, assigning pack slots
    const itemsDeModelo = cart.filter(i => i.modelo.toLowerCase() === item.modelo.toLowerCase());
    let slotsPackRestantes = totalEnPack;
    let enPack = 0;
    let sobrante = 0;

    for (const i of itemsDeModelo) {
      if (i.id === item.id) {
        enPack = Math.min(i.cantidad, slotsPackRestantes);
        sobrante = i.cantidad - enPack;
        break;
      }
      slotsPackRestantes = Math.max(0, slotsPackRestantes - i.cantidad);
    }

    return { enPack, sobrante };
  };

  return (
    <>
      <div className={`fixed top-0 right-0 h-full z-100 transition-transform duration-300 transform 
          ${isOpen ? "translate-x-0" : "translate-x-full"} 
          w-full md:w-100 bg-black border-l border-(--pink-75) flex flex-col shadow-2xl`}>

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div className="flex">
            {step === 1 ? (
              <ShoppingBag size={24} className="text-(--pink-75)" />
            ) : (
              <button onClick={() => setStep(1)} className="mr-2"><ChevronLeft /></button>
            )}
            <div className="ml-3">
              <h2 className="text-xl font-medium">{step === 1 ? "Mi Carrito" : "Finalizar Pedido"}</h2>
              <p className="text-xs text-gray-400">
                {step === 1 ? `${vapesSelect} Vapes seleccionados` : "Completa los datos de entrega"}
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
            <X size={28} />
          </button>
        </div>

        {/* Step 1 — Cart items */}
        {step === 1 ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center mt-20">
                <p className="text-gray-400 mb-4">Tu carrito está vacío.</p>
                <button onClick={() => setIsOpen(false)} className="text-(--pink-75) underline">
                  Seguir comprando
                </button>
              </div>
            ) : (
              cart.map((item: CartItem) => {
                const totalCantidadModelo = cantidadPorModelo[item.modelo.toLowerCase()];
                const { esPack, promoInfo } = calcularPrecio(item.precio, item.modelo, promos, totalCantidadModelo);
                const packActivo = esPack && promoInfo;

                // ✅ Calculate exact price for this item: pack units at pack price, leftovers at normal price
                let precioEsteItem: number;
                let enPack = 0;
                let sobrante = item.cantidad;

                if (packActivo && promoInfo) {
                  const info = getItemPackInfo(item, promoInfo, totalCantidadModelo);
                  enPack = info.enPack;
                  sobrante = info.sobrante;
                  const packSize = promoInfo.cantidad_pack ?? 2;
                  const precioUnitarioPack = promoInfo.desc_valor / packSize;
                  precioEsteItem = Math.round((enPack * precioUnitarioPack) + (sobrante * item.precio));
                } else {
                  precioEsteItem = item.precio * item.cantidad;
                }

                return (
                  <div key={item.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm uppercase text-(--pink-75)">{item.modelo}</h4>
                        <p className="text-gray-300">{item.nombre}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-red-500">
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-3 bg-black/40 rounded-lg p-1 border border-white/10">
                        <button onClick={() => restToCart(item)} className="p-1 hover:text-(--pink-75)"><Minus size={16} /></button>
                        <span className="w-4 text-center font-bold">{item.cantidad}</span>
                        <button onClick={() => addToCart(item)} className="p-1 hover:text-(--pink-75)"><Plus size={16} /></button>
                      </div>

                      <div className="text-right">
                        {packActivo && enPack > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="text-(--pink-75) font-black text-xl italic leading-none">
                              ${precioEsteItem}
                            </span>
                            <span className="text-[10px] text-(--pink-75) opacity-70">
                              {/* Show what's in pack vs leftover */}
                              {enPack > 0 && sobrante > 0
                                ? `${enPack} en promo + ${sobrante} normal`
                                : `Promo: ${promoInfo!.cantidad_pack} x $${promoInfo!.desc_valor}`}
                            </span>
                            <span className="text-gray-500 text-[10px] line-through">
                              ${item.precio * item.cantidad}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className="text-xl font-bold">${precioEsteItem}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="mb-8">
              <h3>MÉTODO DE ENTREGA</h3>
              <div className="flex border border-white/10 w-fit p-1 rounded-xl mt-3 bg-white/5">
                <button
                  onClick={() => setFormData({ ...formData, entrega: "domicilio" })}
                  className={`px-4 py-2 rounded-lg text-sm ${formData.entrega === "domicilio" ? "bg-(--pink-75) text-white" : "text-gray-400"}`}
                >
                  Envío a Domicilio
                </button>
                <button
                  onClick={() => setFormData({ ...formData, entrega: "recoger" })}
                  className={`px-4 py-2 rounded-lg text-sm ${formData.entrega === "recoger" ? "bg-(--pink-75) text-white" : "text-gray-400"}`}
                >
                  Recoger en Tienda
                </button>
              </div>
            </div>

            <div>
              <h3>MÉTODO DE PAGO</h3>
              <div className="flex gap-3 mt-3 flex-wrap">
                {["efectivo", "transferencia", "tarjeta"].map((metodo) => (
                  <button
                    key={metodo}
                    onClick={() => handleTogglePago(metodo)}
                    className={`px-4 py-2 rounded-xl text-sm border capitalize ${
                      formData.pago.includes(metodo)
                        ? "bg-(--pink-75) border-(--pink-75) text-white"
                        : "border-white/10 text-gray-400"
                    }`}
                  >
                    {metodo}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3>QUIÉN RECIBE</h3>
              <input
                type="text"
                placeholder="Tu nombre"
                className="mt-3 w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-(--pink-75)"
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>

            <div>
              <h3>TELÉFONO</h3>
              <input
                type="tel"
                placeholder="Ej. 5296845..."
                className="mt-3 w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-(--pink-75)"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value.replace(/\D/g, "") })}
              />
            </div>

            {formData.entrega === "domicilio" && (
              <>
                <div>
                  <h3>DIRECCIÓN</h3>
                  <textarea
                    rows={3}
                    placeholder="Calle, número..."
                    className="mt-3 w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-(--pink-75)"
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  />
                </div>
                <MapSelector onLocationChange={handleLocationChange} />
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-6 bg-zinc-950 border-t border-white/10 space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-gray-400 text-sm">{step === 1 ? "Subtotal" : "Total (+ Envío)"}:</span>
            <span className="text-2xl font-bold">${step === 1 ? Math.round(total) : Math.round(total + envio)}</span>
          </div>

          {step === 1 ? (
            <button
              disabled={cart.length === 0}
              onClick={() => setStep(2)}
              className="w-full bg-(--pink-75) py-4 rounded-2xl font-bold active:scale-95 transition-all disabled:opacity-30"
            >
              Continuar con el pedido
            </button>
          ) : (
            <button
              disabled={!validateForm()}
              onClick={sendOrder}
              className="w-full flex justify-center gap-2 bg-green-600 py-4 rounded-2xl font-bold active:scale-95 transition-all disabled:opacity-30"
            >
              <MessageCircle /> Enviar a WhatsApp
            </button>
          )}
        </div>
      </div>

      <MsgSend isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}