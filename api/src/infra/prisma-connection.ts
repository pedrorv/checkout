import { prisma } from "../shared/prisma";

let isConnected = false;

export const connectPrisma = async (): Promise<void> => {
  if (!isConnected) {
    try {
      await prisma.$connect();
      console.log("Prisma connected to database");
      isConnected = true;
    } catch (error) {
      console.error("Error connecting to database:", error);
      throw error;
    }
  }
};

export const disconnectPrisma = async (): Promise<void> => {
  if (isConnected) {
    try {
      await prisma.$disconnect();
      console.log("Prisma disconnected from database");
      isConnected = false;
    } catch (error) {
      console.error("Error disconnecting from database:", error);
      throw error;
    }
  }
};

export const isPrismaConnected = (): boolean => isConnected;
