import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // BOM 모듈의 CAD 파일(.SLDPRT/.SLDASM) 업로드를 위해 기본 1MB 제한을 늘림.
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
