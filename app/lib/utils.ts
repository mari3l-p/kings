// lib/utils.ts
export interface PromoType {
  categoria: string;
  desc_tipo: string;
  desc_valor: number;
  activo: boolean;
  comienza: string;
  termina: string;
}

// Esta función es la "Calculadora Maestra"
export function calcularPrecio(precioBase: number, nombreModelo: string, promos: PromoType[] | null) {
    if (!promos) return precioBase;

    const promo = promos.find(p =>
        p.categoria.toLowerCase() === nombreModelo.toLowerCase()
    );

    if (!promo) return precioBase;

    if (promo.desc_tipo === "porcentaje") {
        return precioBase - (precioBase * promo.desc_valor / 100);
    }

    if (promo.desc_tipo === "fijo") {
        return precioBase - promo.desc_valor;
    }

    return precioBase;
}