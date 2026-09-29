import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Foto de produto: cópia no Cloudinary (página do produto) e origem no
    // Open Food Facts (só prévia no cadastro).
    remotePatterns: [
      new URL("https://res.cloudinary.com/**"),
      new URL("https://images.openfoodfacts.org/**"),
      new URL("https://static.openfoodfacts.org/**"),
    ],
  },
  redirects() {
    return [{ source: "/signup", destination: "/login", permanent: false }];
  },
};

export default nextConfig;
