// Seeds the database with the FAKE sample lodges (isSample = true).
// Run with: npx prisma db seed
//
// TODO (Denen): when you add real lodges, put them in their own file
// (e.g. prisma/data/lodges.ts) with isSample: false and a lastChecked date
// for every row you verified by hand.
import { PrismaClient } from "@prisma/client";
import { SAMPLE_LODGES } from "../src/data/sampleLodges";

const prisma = new PrismaClient();

async function main() {
  for (const lodge of SAMPLE_LODGES) {
    const data = {
      ...lodge,
      lastChecked: lodge.lastChecked ? new Date(lodge.lastChecked) : null,
    };
    await prisma.lodge.upsert({ where: { id: lodge.id }, update: data, create: data });
  }
  console.log(`Seeded ${SAMPLE_LODGES.length} sample lodges.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
