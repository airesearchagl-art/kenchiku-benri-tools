import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ['resium', 'cesium', 'react-map-gl', 'mapbox-gl'],
  output: "standalone",
  reactStrictMode: true,
  // Vercelビルドエラー回避: Webpack設定がある場合、Turbopack設定も（空でも）必要
  // @ts-ignore NextConfig型定義に追いついていない可能性があるためignore
  turbopack: {},
  webpack: (config, { webpack, isServer }) => {
    // Note: copy-webpack-plugin removed to avoid network drive errors.
    // We are using CDN for Cesium assets.
    config.plugins.push(
      new webpack.DefinePlugin({
        // Use a generic CDN for Cesium assets (Workers, etc.)
        CESIUM_BASE_URL: JSON.stringify("https://cesium.com/downloads/cesiumjs/releases/1.114/Build/Cesium"),
      })
    );
    return config;
  },
};

export default nextConfig;
