import { createFrames } from "frames.js/next";
import {
  farcasterHubContext,
  warpcastComposerActionState,
} from "frames.js/middleware";
import { config } from "dotenv";

config();

console.log("AIRSTACK_API_KEY in frames.ts:", process.env.AIRSTACK_API_KEY ? "Defined" : "Undefined");
export const frames = createFrames({
  basePath: "/frames",
  debug: process.env.NODE_ENV === "development",
  middleware: [
    farcasterHubContext({
      ...(process.env.NODE_ENV === "production"
        ? {
            hubHttpUrl: "https://hubs.airstack.xyz",
            hubRequestOptions: {
              headers: {
                  "x-airstack-hubs": process.env.AIRSTACK_API_KEY || "",
              },
            },
          }
        : {
            hubHttpUrl: "http://localhost:3001/hub",
          }),
    }),
    warpcastComposerActionState(),
  ],
});
