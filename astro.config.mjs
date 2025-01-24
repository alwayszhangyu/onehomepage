import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

// 获取主域名
const getBaseUrl = () => {
  // 如果是开发环境，使用 localhost
  if (process.env.NODE_ENV === 'development') {
    return 'https://www.houxiongxiong.icu';
  }

  // 如果是生产环境，自动获取主域名
  return process.env.BASE_URL || 'https://www.houxiongxiong.icu';
};

export default defineConfig({
  integrations: [tailwind()],

  // 动态获取主域名
  site: getBaseUrl(),

  // mode: 不同的网站 cn/top/moe
  siteMode: "moe"
});
