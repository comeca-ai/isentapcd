import { eq } from "drizzle-orm";
import { getDb } from "../api/queries/connection";
import { vehicles } from "./schema";

/**
 * Catálogo do simulador: ~10 veículos genéricos (sem marca), preços realistas
 * 2026 (R$ 62–118 mil), mix flex/híbrido/elétrico. Idempotente por slug.
 */
const CARS = [
  { slug: "hatch-compacto-10-flex", nome: "Hatch Compacto 1.0 Flex", categoria: "hatch", precoCentavos: 62_900_00, combustivel: "flex", adaptacao: false, imagem: "/sim-car-hatch.png" },
  { slug: "hatch-compacto-10-at-flex", nome: "Hatch Compacto 1.0 Automático Flex", categoria: "hatch", precoCentavos: 71_500_00, combustivel: "flex", adaptacao: false, imagem: "/sim-car-hatch.png" },
  { slug: "hatch-compacto-adaptado-flex", nome: "Hatch Compacto 1.0 Adaptado Flex", categoria: "hatch", precoCentavos: 79_900_00, combustivel: "flex", adaptacao: true, imagem: "/sim-car-hatch.png" },
  { slug: "sedan-compacto-16-flex", nome: "Sedã Compacto 1.6 Automático Flex", categoria: "sedan", precoCentavos: 96_500_00, combustivel: "flex", adaptacao: false, imagem: "/sim-car-sedan.png" },
  { slug: "sedan-medio-20-at-flex", nome: "Sedã Médio 2.0 Automático Flex", categoria: "sedan", precoCentavos: 118_000_00, combustivel: "flex", adaptacao: false, imagem: "/sim-car-sedan.png" },
  { slug: "suv-compacto-16-flex", nome: "SUV Compacto 1.6 Automático Flex", categoria: "suv", precoCentavos: 109_900_00, combustivel: "flex", adaptacao: false, imagem: "/sim-car-suv.png" },
  { slug: "suv-compacto-adaptado-flex", nome: "SUV Compacto Adaptado Flex", categoria: "suv", precoCentavos: 115_500_00, combustivel: "flex", adaptacao: true, imagem: "/sim-car-suv.png" },
  { slug: "hatch-hibrido-flex", nome: "Hatch Híbrido Flex Automático", categoria: "hatch", precoCentavos: 104_900_00, combustivel: "hibrido", adaptacao: false, imagem: "/sim-car-hatch.png" },
  { slug: "sedan-hibrido-flex", nome: "Sedã Híbrido Flex Automático", categoria: "sedan", precoCentavos: 116_900_00, combustivel: "hibrido", adaptacao: false, imagem: "/sim-car-sedan.png" },
  { slug: "suv-eletrico-compacto", nome: "SUV Elétrico Compacto", categoria: "suv", precoCentavos: 117_900_00, combustivel: "eletrico", adaptacao: false, imagem: "/sim-car-suv.png" },
] as const;

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  for (const car of CARS) {
    const existing = await db.query.vehicles.findFirst({
      where: eq(vehicles.slug, car.slug),
    });
    if (existing) {
      await db.update(vehicles).set({ ...car }).where(eq(vehicles.slug, car.slug));
    } else {
      await db.insert(vehicles).values({ ...car });
    }
  }
  console.log(`${CARS.length} veículos no catálogo.`);

  console.log("Done.");
  process.exit(0); // close MySQL connection pool
}

seed();
