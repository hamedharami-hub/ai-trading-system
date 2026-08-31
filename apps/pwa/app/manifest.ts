import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "سامانه تحلیل معاملاتی",
    short_name: "تحلیل معاملاتی",
    description: "رابط محلی و ایمن تحلیل معاملاتی",
    display: "standalone",
    start_url: "/",
    background_color: "#0b1020",
    theme_color: "#0b1020",
  };
}
