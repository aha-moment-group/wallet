import assert from "assert";

export const env = process.env.NODE_ENV ? process.env.NODE_ENV : "development";
assert.ok(env === "development" || env === "test" || env === "production");
