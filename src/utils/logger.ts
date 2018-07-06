import { LoggingBunyan as StackdriverLogging } from "@google-cloud/logging-bunyan";
import bunyan from "bunyan";

import { env } from "../../config";

const stackdriverLogging = new StackdriverLogging();

export const getLogger = (name: string): bunyan =>
  env === "production"
    ? bunyan.createLogger({
        name,
        streams: [
          { level: bunyan.DEBUG, stream: process.stdout },
          stackdriverLogging.stream(bunyan.DEBUG)
        ]
      })
    : bunyan.createLogger({
        name,
        streams: [{ level: bunyan.DEBUG, stream: process.stdout }]
      });
