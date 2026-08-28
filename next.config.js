/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['pdfkit', 'exceljs', 'docx', 'pg']
  }
};

module.exports = nextConfig;
