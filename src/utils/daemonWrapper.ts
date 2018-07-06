import { getLogger } from "./logger";

const logger = getLogger("daemonWrapper");

export const daemonWrapper = async (
  routine: () => Promise<number>
): Promise<void> => {
  const name: string = process.mainModule!.exports.default.name;
  try {
    logger.info(`${name} started`);
    while (true) {
      const delay = await routine();
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  } catch (err) {
    logger.error(err);
  } finally {
    logger.info(`${name} ended`);
  }
};
