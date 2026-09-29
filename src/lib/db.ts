import { PrismaClient } from "@prisma/client";

// Reuse one PrismaClient in development (Next.js hot reload creates many otherwise).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
