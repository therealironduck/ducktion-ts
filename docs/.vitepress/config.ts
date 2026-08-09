import { defineConfig } from "vitepress";
import { groupIconMdPlugin, groupIconVitePlugin } from "vitepress-plugin-group-icons";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Ducktion TS",
  description: "The best dependency injection container for Typescript",
  base: "/ducktion-ts/",
  lastUpdated: true,
  appearance: "force-dark",

  themeConfig: {
    nav: [
      { text: "Getting Started", link: "/getting-started" },
      { text: "Changelog", link: "https://github.com/therealironduck/ducktion-ts/releases" },
    ],

    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "Getting Started", link: "/getting-started" },
          { text: "Use with Vite", link: "/use/vite" },
          { text: "Use with Rolldown", link: "/use/rolldown" },
        ],
      },

      {
        text: "Basics",
        items: [
          { text: "Configure the container", link: "/basics/configure" },
          { text: "Configurator classes", link: "/basics/configurators" },
          { text: "Register services", link: "/basics/register" },
          { text: "Resolve services", link: "/basics/resolve" },
          { text: "Override services", link: "/basics/override" },
        ],
      },

      {
        text: "Services",
        items: [
          { text: "Lazy Loading", link: "/services/lazy-loading" },
          { text: "Singleton services", link: "/services/singleton" },
          { text: "Bind specific instances", link: "/services/bind-specific-instances" },
          { text: "Dynamic instantiation", link: "/services/dynamic-instantiation" },
          { text: "Parameter Binding", link: "/services/parameters" },
          { text: "Service IDs", link: "/services/ids" },
          { text: "Auto Resolve", link: "/services/auto-resolve" },
          { text: "Tagging", link: "/services/tagging" },
        ],
      },

      {
        text: "Internals",
        items: [
          { text: "Internal mechanisms", link: "/internal/mechanisms" },
          { text: "Resolve workflow", link: "/internal/resolve-workflow" },
        ],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/therealironduck/ducktion-ts" }],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026-present Jordan Kniest",
    },

    editLink: {
      pattern: "https://github.com/therealironduck/ducktion-ts/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },

    search: {
      provider: "local",
    },
  },

  markdown: {
    theme: {
      light: "catppuccin-latte",
      dark: "catppuccin-mocha",
    },

    config(md) {
      md.use(groupIconMdPlugin);
    },
  },

  vite: {
    plugins: [groupIconVitePlugin()],
  },
});
