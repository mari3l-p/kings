export interface PromoType {
  id: number;
  categoria: string;
  desc_tipo: string;
  desc_valor: number;
  cantidad_pack?: number;
  activo: boolean;
  comienza: string;
  termina: string;
}

export interface DailyPromoType {
  id: number;
  nombre: string;
  dia_semana: string;
  desc_tipo: string;
  desc_valor: number;
  cantidad_pack?: number;
  modelo_id: number | null;
  imagen_url?: string;
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
    if (numPacks === 0) {
      return { precioFinal: precioBase * cantidadEnCarrito, esPack: false, promoInfo: promo };
    }
    const total = numPacks * promo.desc_valor + sobrantes * precioBase;
    return { precioFinal: Math.round(total), esPack: true, promoInfo: promo };
  }

  return defaultReturn;
}

// ✅ Unified calculator: daily promo takes priority over regular promo
// Returns a normalized result shape regardless of which promo source wins
export function calcularPrecioFinal(
  precioBase: number,
  modeloId: number,
  modeloNombre: string,
  promos: PromoType[] | null,
  dailyPromos: DailyPromoType[] | null,
  cantidadEnCarrito: number = 1
): { precioFinal: number; esPack: boolean; promoInfo: PromoType | DailyPromoType | null; esDiaria: boolean } {

  const defaultReturn = {
    precioFinal: precioBase * cantidadEnCarrito,
    esPack: false,
    promoInfo: null as PromoType | DailyPromoType | null,
    esDiaria: false,
  };

  // 1. Check daily promo first (higher priority)
  if (dailyPromos && Array.isArray(dailyPromos)) {
    const daily = dailyPromos.find(
      (d) => d.modelo_id === null || d.modelo_id === modeloId
    );

    if (daily) {
      if (daily.desc_tipo === "porcentaje") {
        const precioUnitario = precioBase - (precioBase * daily.desc_valor) / 100;
        return { precioFinal: Math.round(precioUnitario * cantidadEnCarrito), esPack: false, promoInfo: daily, esDiaria: true };
      }
      if (daily.desc_tipo === "fijo") {
        const precioUnitario = precioBase - daily.desc_valor;
        return { precioFinal: Math.round(precioUnitario * cantidadEnCarrito), esPack: false, promoInfo: daily, esDiaria: true };
      }
      if (daily.desc_tipo === "pack" && daily.cantidad_pack) {
        const numPacks = Math.floor(cantidadEnCarrito / daily.cantidad_pack);
        const sobrantes = cantidadEnCarrito % daily.cantidad_pack;
        if (numPacks === 0) {
          return { precioFinal: precioBase * cantidadEnCarrito, esPack: false, promoInfo: daily, esDiaria: true };
        }
        const total = numPacks * daily.desc_valor + sobrantes * precioBase;
        return { precioFinal: Math.round(total), esPack: true, promoInfo: daily, esDiaria: true };
      }
    }
  }

  // 2. Fall back to regular promo
  const regular = calcularPrecio(precioBase, modeloNombre, promos, cantidadEnCarrito);
  return { ...regular, esDiaria: false };
}