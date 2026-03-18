import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: __dirname,  // это строго указывает: "корень — текущая папка crmfront"
  },
  devIndicators:false
  
};

export default nextConfig;
