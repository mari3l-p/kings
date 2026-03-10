export interface PromoType {
  id: number        // ✅ add this
  categoria: string;
  desc_tipo: string;
  desc_valor: number;
  cantidad_pack?: number;
  activo: boolean;
  comienza: string;
  termina: string;
}

export function calcularPrecio(
  precioBase: number,
  nombreModelo: string,
  promos: PromoType[] | null,
  cantidadEnCarrito: number = 1
): { precioFinal: number; esPack: boolean; promoInfo: PromoType | null } {

  const defaultReturn = {
    precioFinal: precioBase * cantidadEnCarrito,
    esPack: false,
    promoInfo: null as PromoType | null,
  };

  if (!promos || !Array.isArray(promos)) return defaultReturn;

  const ahora = new Date();

  const promo = promos.find(
    (p) =>
      p.categoria?.toLowerCase() === nombreModelo?.toLowerCase() &&
      p.activo &&
      ahora >= new Date(p.comienza) &&
      ahora <= new Date(p.termina)
  );

  if (!promo) return defaultReturn;

  if (promo.desc_tipo === "porcentaje") {
    const precioUnitario = precioBase - (precioBase * (promo.desc_valor || 0)) / 100;
    return { precioFinal: Math.round(precioUnitario * cantidadEnCarrito), esPack: false, promoInfo: promo };
  }

  if (promo.desc_tipo === "fijo") {
    const precioUnitario = precioBase - (promo.desc_valor || 0);
    return { precioFinal: Math.round(precioUnitario * cantidadEnCarrito), esPack: false, promoInfo: promo };
  }

  if (promo.desc_tipo === "pack" && promo.cantidad_pack) {
    const numPacks = Math.floor(cantidadEnCarrito / promo.cantidad_pack);
    const sobrantes = cantidadEnCarrito % promo.cantidad_pack;

    // ✅ Not enough for a full pack — charge normal price
    if (numPacks === 0) {
      return { precioFinal: precioBase * cantidadEnCarrito, esPack: false, promoInfo: promo };
    }

    const total = (numPacks * promo.desc_valor) + (sobrantes * precioBase);
    return { precioFinal: Math.round(total), esPack: true, promoInfo: promo };
  }

  return defaultReturn;
}