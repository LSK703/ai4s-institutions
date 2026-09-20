import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  publicDir: "public",
  server: {
    port: 5173,
    open: true,
  },
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, "index.html"),
        list: resolve(__dirname, "explore/list.html"),
        chart: resolve(__dirname, "explore/chart.html"),
        map: resolve(__dirname, "explore/map.html"),
        compare: resolve(__dirname, "explore/compare.html"),
        institution: resolve(__dirname, "institution.html"),
        infoHub: resolve(__dirname, "info/index.html"),
        infoData: resolve(__dirname, "info/data.html"),
        infoIndicators: resolve(__dirname, "info/indicators.html"),
        infoInstitutions: resolve(__dirname, "info/institutions.html"),
        infoUse: resolve(__dirname, "info/responsible-use.html"),
      },
    },
  },
});
