import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

// List of required environment variables
const requiredEnvVariables = ["API_URL", "NEXT_PUBLIC_TRPC_URL", "TRPC_URL"];

// Validate environment variables
requiredEnvVariables.forEach((variable) => {
  if (!process.env[variable]) {
    throw new Error(`Environment variable ${variable} is not defined!`);
  }
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    return [
      {
        source: "/trpc/:path*",
        destination: `${process.env.TRPC_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
