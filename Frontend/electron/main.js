import { app, BrowserWindow } from "electron";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VITE_DEV_SERVER_URL =
  process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    title: "My Cool App",
    icon: join(__dirname, "../public/logo.png"),
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(join(__dirname, "../dist/index.html"));
  }

  win.webContents.on("before-input-event", (event, input) => {
    const key = (input.key || "").toString();
    const isCtrlShiftI =
      input.control && input.shift && key.toLowerCase() === "i";
    const isCtrlShiftC =
      input.control && input.shift && key.toLowerCase() === "c";
    const isF12 = key === "F12";
    if (isCtrlShiftI || isCtrlShiftC || isF12) {
      event.preventDefault();
    }
  });

  win.webContents.on("devtools-opened", () => {
    win.webContents.closeDevTools();
  });

  win.webContents.on("context-menu", (e) => {
    e.preventDefault();
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
