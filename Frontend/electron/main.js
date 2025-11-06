import { app, BrowserWindow } from "electron";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { spawn } from "child_process";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VITE_DEV_SERVER_URL =
  process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

let backendProcess = null;
let frontendProcess = null;
let backendErrorOutput = [];
let backendStdOutput = [];

// Determine if we're in development or production
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

function startBackend() {
  return new Promise((resolve, reject) => {
    try {
      const backendPath = isDev
        ? join(__dirname, "../../Backend")
        : join(process.resourcesPath, "Backend");

      console.log("Starting backend from:", backendPath);
      console.log("Is development mode:", isDev);
      console.log("App is packaged:", app.isPackaged);

      // Set up environment variables for backend
      const env = Object.assign({}, process.env);

      // In production, we need to ensure these are set
      if (!isDev) {
        env.NODE_ENV = "production";
        env.PORT = env.PORT || "3000";
        env.JWT_SECRET = env.JWT_SECRET || "devsecret";

        // Add any other required env vars with defaults
        // These should be configurable by the user later
        if (!env.DATABASE_URL) {
          console.warn(
            "DATABASE_URL not set, backend may fail to connect to database"
          );
        }
      }

      if (isDev) {
        // In development, use npm run start:dev
        backendProcess = spawn("npm", ["run", "start:dev"], {
          cwd: backendPath,
          shell: true,
          stdio: "pipe",
          env: env,
        });
      } else {
        // In production, use node to run the built backend
        // NestJS builds to dist/src/main.js structure
        const backendMain = join(backendPath, "dist", "src", "main.js");
        const nodeModulesPath = join(backendPath, "node_modules");

        console.log("Backend main file:", backendMain);
        console.log("Backend main exists:", existsSync(backendMain));
        console.log("Node modules path:", nodeModulesPath);
        console.log("Node modules exists:", existsSync(nodeModulesPath));
        console.log("Backend path exists:", existsSync(backendPath));

        // Check if backend files exist
        if (!existsSync(backendMain)) {
          reject(
            new Error(
              `Backend main.js not found at: ${backendMain}\nBackend path: ${backendPath}`
            )
          );
          return;
        }

        // Set NODE_PATH to include backend's node_modules
        env.NODE_PATH = nodeModulesPath;

        backendProcess = spawn("node", [backendMain], {
          cwd: backendPath,
          shell: true,
          stdio: "pipe",
          env: env,
        });
      }

      backendProcess.stdout.on("data", (data) => {
        const message = data.toString();
        backendStdOutput.push(message);
        console.log(`Backend: ${message}`);
        // Check if backend is ready by looking for the listening message
        if (message.includes("listening") || message.includes("started")) {
          resolve();
        }
      });

      backendProcess.stderr.on("data", (data) => {
        const message = data.toString();
        backendErrorOutput.push(message);
        console.error(`Backend Error: ${message}`);
        // Don't reject on stderr as some messages might be warnings
      });

      backendProcess.on("error", (error) => {
        console.error("Failed to start backend process:", error);
        reject(error);
      });

      backendProcess.on("exit", (code, signal) => {
        console.log(
          `Backend process exited with code ${code} and signal ${signal}`
        );
        if (code !== 0 && code !== null) {
          const errorDetails =
            backendErrorOutput.join("\n") ||
            backendStdOutput.join("\n") ||
            "No error details available";
          reject(
            new Error(
              `Backend exited with code ${code}.\n\nDetails:\n${errorDetails}`
            )
          );
        }
      });

      // Fallback timeout - resolve after 8 seconds even if we don't see the message
      setTimeout(() => {
        console.log("Backend startup timeout reached, assuming ready");
        resolve();
      }, 8000);
    } catch (error) {
      console.error("Error starting backend:", error);
      reject(error);
    }
  });
}

function startFrontend() {
  return new Promise((resolve, reject) => {
    if (isDev) {
      try {
        const frontendPath = join(__dirname, "..");
        console.log("Starting frontend from:", frontendPath);

        frontendProcess = spawn("npm", ["run", "dev"], {
          cwd: frontendPath,
          shell: true,
          stdio: "pipe",
        });

        frontendProcess.stdout.on("data", (data) => {
          console.log(`Frontend: ${data}`);
        });

        frontendProcess.stderr.on("data", (data) => {
          console.error(`Frontend Error: ${data}`);
        });

        frontendProcess.on("error", (error) => {
          console.error("Failed to start frontend:", error);
          reject(error);
        });

        // Wait for frontend to be ready
        setTimeout(() => {
          console.log("Frontend should be ready");
          resolve();
        }, 3000);
      } catch (error) {
        console.error("Error starting frontend:", error);
        reject(error);
      }
    } else {
      // In production, frontend is served from dist files
      resolve();
    }
  });
}

async function createWindow() {
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
      devTools: true,
    },
  });

  // Open DevTools to see backend startup logs
  if (!isDev) {
    win.webContents.openDevTools();
  }

  // Show loading message
  win.loadURL(
    "data:text/html;charset=utf-8," +
      encodeURIComponent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #282c34;
            color: white;
            font-family: Arial, sans-serif;
          }
          .loader {
            text-align: center;
          }
          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          #status {
            margin-top: 20px;
            font-size: 14px;
            color: #3498db;
          }
        </style>
      </head>
      <body>
        <div class="loader">
          <div class="spinner"></div>
          <h2>Starting Application...</h2>
          <p>Please wait while the backend and frontend are initializing...</p>
          <p id="status">Initializing...</p>
        </div>
        <script>
          console.log("Loading screen displayed");
          setTimeout(() => {
            document.getElementById('status').textContent = 'Starting backend server...';
          }, 1000);
          setTimeout(() => {
            document.getElementById('status').textContent = 'Backend should be ready soon...';
          }, 5000);
        </script>
      </body>
    </html>
  `)
  );

  try {
    console.log("About to start backend...");
    // Start backend first
    await startBackend();
    console.log("Backend started successfully!");

    // Then start frontend (only in dev mode)
    await startFrontend();
    console.log("Frontend started successfully!");

    // Wait a bit more to ensure backend is fully ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Load the application
    if (isDev && VITE_DEV_SERVER_URL) {
      console.log("Loading dev server:", VITE_DEV_SERVER_URL);
      win.loadURL(VITE_DEV_SERVER_URL);
    } else {
      console.log("Loading production build");
      win.loadFile(join(__dirname, "../dist/index.html"));
    }
  } catch (error) {
    console.error("Failed to start application:", error);
    const errorMessage = error.message || "Unknown error";
    const errorHtml = errorMessage.replace(/\n/g, "<br>");

    win.loadURL(
      "data:text/html;charset=utf-8," +
        encodeURIComponent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #282c34;
              color: white;
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            .error {
              text-align: center;
              max-width: 800px;
              background: #1e1e1e;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            }
            h2 { color: #e74c3c; margin-top: 0; }
            .details {
              background: #0d0d0d;
              padding: 15px;
              border-radius: 5px;
              margin-top: 20px;
              text-align: left;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              overflow-x: auto;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            button {
              margin-top: 20px;
              padding: 10px 20px;
              background: #3498db;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
            }
            button:hover {
              background: #2980b9;
            }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>Failed to Start Application</h2>
            <p>There was an error starting the backend service.</p>
            <div class="details">${errorHtml}</div>
            <button onclick="require('electron').ipcRenderer.send('quit-app')">Close Application</button>
          </div>
        </body>
      </html>
    `)
    );
  }

  // DevTools are enabled; allow default shortcuts (F12, Ctrl+Shift+I/C) and keep them open

  win.webContents.on("context-menu", (e) => {
    e.preventDefault();
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  // Clean up processes
  if (backendProcess) {
    backendProcess.kill();
  }
  if (frontendProcess) {
    frontendProcess.kill();
  }

  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  // Ensure processes are terminated
  if (backendProcess) {
    backendProcess.kill();
  }
  if (frontendProcess) {
    frontendProcess.kill();
  }
});
