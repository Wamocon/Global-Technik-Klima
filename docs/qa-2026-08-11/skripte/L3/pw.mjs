// Resolve playwright out of the project's node_modules even though this script
// lives in the scratchpad (ESM resolves relative to the file, not cwd).
import { createRequire } from 'node:module'
const require = createRequire('D:/01 Antigrafity Projekte/25 Global-Technik-Klima/package.json')
export const { chromium, devices } = require('playwright')
export const BASE = 'http://localhost:4321'
export const DIR = 'C:/Users/WALERI~1/AppData/Local/Temp/claude/D--01-Antigrafity-Projekte-25-Global-Technik-Klima/658f579e-479d-4a39-b068-e846b182cbfd/scratchpad/L3'
