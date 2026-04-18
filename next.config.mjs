import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin();
const nextConfig = { images: { remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }] } };
export default withNextIntl(nextConfig);
