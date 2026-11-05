import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['resium', 'cesium', 'react-map-gl', 'mapbox-gl'],
  output: "standalone",
  reactStrictMode: true,
  compiler: {
    // Shared by Turbopack production builds and webpack development builds.
    // Keep workers and static assets aligned with the installed Cesium version.
    define: {
      CESIUM_BASE_URL: "https://cesium.com/downloads/cesiumjs/releases/1.146/Build/Cesium/",
    },
  },
};

export default nextConfig;
