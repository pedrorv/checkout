import { isIntegrationTest, setupDB } from "./helpers";

module.exports = async () => {
  try {
    if (isIntegrationTest) {
      await setupDB();
    }
  } catch (error) {
    console.log({ error });
  }
};
