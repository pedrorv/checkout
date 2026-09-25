import { prisma } from "../src/shared/prisma";

import { isIntegrationTest } from "./helpers";

afterAll(async () => {
  if (isIntegrationTest) {
    await prisma.$disconnect();
  }
});
