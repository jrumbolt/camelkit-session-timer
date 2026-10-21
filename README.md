# Session Timer

A lightweight CamelKit plugin for Memories of Magic that tracks how long you've been playing during your current session.

## Features

- **Session tracking:** Displays elapsed time in hours, minutes, and seconds.
- **Sidebar timer:** View your current session duration in the CamelKit sidebar.
- **Chatbox timer:** Optionally display the timer alongside the in-game chat tabs.
- **Customizable appearance:** Show or hide the chatbox timer's background.
- **Saved preferences:** Remembers your display settings between client restarts.

Both the **Show on chatbox** and **Show background** options are enabled by default and can be customized in the plugin's settings.

The timer starts automatically when the plugin is enabled and resets when the plugin is disabled or client is restarted.

## Building

Requires Node.js 22 and Yarn 4.

```bash
yarn install --immutable
yarn build
```

The compiled plugin is generated at `dist/plugin.js`.

## License

Licensed under the GNU General Public License v3.0 (GPL-3.0-only).