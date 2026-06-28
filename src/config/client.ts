import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const client =
  globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production")
  globalForPrisma.prisma = client;

export async function connectWithRetry(retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await client.$connect();
      console.log("✅ Prisma connected");
      return;
    } catch (err) {
      console.warn(`⏳ DB not ready, retry ${i + 1}/${retries}...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error("❌ Could not connect to database after retries");
}

export async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const isConnectionError = err?.message?.includes("Can't reach database server");
      if (isConnectionError && i < retries - 1) {
        console.warn(`⏳ DB connection lost, retry ${i + 1}/${retries}...`);
        await client.$disconnect();
        await new Promise((res) => setTimeout(res, delay));
        await client.$connect();
      } else {
        throw err;
      }
    }
  }
  throw new Error("❌ Query failed after retries");
}