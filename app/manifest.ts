import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Locally",
    short_name: "Locally",
    description: "Discover hyperlocal clothing stores near you",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#0F6E56",
    icons: [{ src: "/favicon.ico", sizes: "any" }],
  };
}
