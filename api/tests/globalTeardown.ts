import { disconnectDB, isIntegrationTest } from "./helpers";

module.exports = async () => {
  try {
    if (isIntegrationTest) {
      await disconnectDB();
    }
  } catch (error) {
    console.log({ error });
  }
};
