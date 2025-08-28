import debug from "debug";

if (debug.enabled("nolingo")) debug.enable("nolingo,nolingo:*");

export const logger = debug("nolingo");
