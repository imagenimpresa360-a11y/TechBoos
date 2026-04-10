const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

const cuentas = [
  "Arriendos",
  "Servicios Básicos (agua, luz, internet)",
  "Sueldos de Entrenadores",
  "Banco ( Creditos)",
  "Mantenimiento de Equipos (reparacion o compra)",
  "Plataforma de Reservas/Gestión (BoxMagic, Lioren, virtual post)",
  "Otras platadormas compartidas (liorent)",
  "Otras platadormas compartidas (virtualpost)",
  "Administración (gerencia y admin)",
  "Asesores",
  "Limpieza y Aseo y Art. Aseo.",
  "Impuestos, convenios y rentas"
];

async function main() {
  console.log("🌱 Iniciando carga de Plan de Cuentas v38...");
  for (const nombre of cuentas) {
    await prisma.cuentaContable.upsert({
      where: { nombre },
      update: {},
      create: { nombre }
    });
  }
  console.log("✅ Plan de Cuentas cargado con éxito en Postgres.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
