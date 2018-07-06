import { getLogger } from "./logger";

const logger = getLogger("daemonWrapper");

export abstract class Daemon {
  public static all(daemons: Daemon[]): Promise<void[]> {
    return Promise.all(daemons.map(d => d.run()));
  }

  public async run(): Promise<void> {
    const name: string = this.constructor.name;
    try {
      logger.info(`${name} started`);
      while (true) {
        const delay = await this.routine();
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (err) {
      logger.error(err);
    } finally {
      logger.info(`${name} ended`);
    }
  }

  protected abstract routine(): Promise<number>;
}
