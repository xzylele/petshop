// ตั้งค่า Next.js โดยกำหนดแหล่งรูปภาพที่อนุญาตให้โหลดจากภายนอก
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" }
    ]
  }
};

export default nextConfig;
