import { Client as Pg } from "pg";

import { db as config } from "../../config";

export const getPg = () => new Pg(config);
