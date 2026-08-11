// Re-export playwright from the project's node_modules (scripts live outside the project tree).
const pw = await import('file:///D:/01%20Antigrafity%20Projekte/25%20Global-Technik-Klima/node_modules/playwright/index.mjs')
export const chromium = pw.chromium
export const devices = pw.devices
export default pw
