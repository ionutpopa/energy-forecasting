const colors = {
    info: "\x1b[32m", // Green
    warning: "\x1b[33m", // Yellow
    error: "\x1b[31m", // Red
  };
  
  /**
   * Logs a message to the console
   * @param message - The message to log
   * @param level - The level of the log
   */
  const logger = (
    message: string,
    level?: "info" | "warning" | "error"
  ) => {
    const timestamp = new Date().toISOString();
    const color = colors?.[level || 'info'] || "\x1b[0m"; // Default to no color
    console.log(`[${timestamp}] ${color}[${(level || "info").toUpperCase()}]: ${message}\x1b[0m`);
  };
  
  export default logger;