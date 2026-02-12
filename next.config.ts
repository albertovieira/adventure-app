import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Isto resolve o erro de Cross Origin do IDX
    allowedDevOrigins: [
      "3000-firebase-adventure-app-1770816348014.cluster-cbeiita7rbe7iuwhvjs5zww2i4.cloudworkstations.dev",
      "3012-firebase-adventure-app-1770816348014.cluster-cbeiita7rbe7iuwhvjs5zww2i4.cloudworkstations.dev"
    ]
  }
};

export default nextConfig;