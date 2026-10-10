// Light/dark theme. Loaded in <head> so the saved choice applies before the page paints.
// With no saved choice the page follows the operating system setting.
const SiteTheme = (() => {
  const STORAGE_KEY = "theme";
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  function savedChoice() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  function apply(choice) {
    if (choice === "light" || choice === "dark") {
      document.documentElement.dataset.theme = choice;
    } else {
      delete document.documentElement.dataset.theme;
    }
  }

  function isDark() {
    const choice = document.documentElement.dataset.theme;
    return choice ? choice === "dark" : media.matches;
  }

  function toggle() {
    const next = isDark() ? "light" : "dark";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (error) {
      // Still switch for this page view
    }
    apply(next);
    changed();
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // Flat Plotly attribute updates that match the current theme
  function plotUpdates(layout = {}) {
    const updates = {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      "font.color": cssVar("--text"),
      "legend.bgcolor": cssVar("--legend-bg"),
    };
    const axes = new Set(["xaxis", "yaxis", ...Object.keys(layout).filter((key) => /^[xy]axis\d*$/.test(key))]);
    axes.forEach((axis) => {
      updates[axis + ".gridcolor"] = cssVar("--grid");
      updates[axis + ".zerolinecolor"] = cssVar("--border");
      updates[axis + ".linecolor"] = cssVar("--border");
    });
    return updates;
  }

  // Returns the layout with theme colours filled in, for Plotly.newPlot
  function plotLayout(layout) {
    Object.entries(plotUpdates(layout)).forEach(([path, value]) => {
      const keys = path.split(".");
      let target = layout;
      keys.slice(0, -1).forEach((key) => {
        target[key] = target[key] || {};
        target = target[key];
      });
      target[keys[keys.length - 1]] = value;
    });
    return layout;
  }

  function changed() {
    if (window.Plotly) {
      document.querySelectorAll(".js-plotly-plot").forEach((plot) => {
        Plotly.relayout(plot, plotUpdates(plot.layout));
      });
    }
    document.dispatchEvent(new CustomEvent("themechange"));
  }

  apply(savedChoice());
  media.addEventListener("change", () => {
    if (!document.documentElement.dataset.theme) changed();
  });

  return { isDark, toggle, plotLayout };
})();
