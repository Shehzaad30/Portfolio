/* Editorial Studio — design tokens */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        paper: "#FAFAF8",
        panel: "#F2F1EC",
        ink: "#141414",
        "ink-deep": "#0D0D0D",
        muted: "#6E6A63",
        line: "#E3E1DA",
        cobalt: "#1B3CFF",
        "cobalt-bright": "#5772FF"
      },
      fontFamily: {
        display: ['"Clash Display"', "Georgia", "sans-serif"],
        serif: ['"Newsreader"', "Georgia", "serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"]
      },
      maxWidth: {
        container: "1240px"
      }
    }
  }
};
