import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

const CONFIG_DIR = path.join(os.homedir(), '.smartcloud')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')
const AUTH_FILE = path.join(CONFIG_DIR, 'auth.json')

export interface CliConfig {
  base_url?: string
  default_project?: string
}

export interface AuthConfig {
  access_token?: string
  email?: string
}

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 })
  }
}

export function loadConfig(): CliConfig {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

export function saveConfig(config: CliConfig): void {
  ensureConfigDir()
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 })
}

export function loadAuth(): AuthConfig {
  try {
    return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

export function saveAuth(auth: AuthConfig): void {
  ensureConfigDir()
  fs.writeFileSync(AUTH_FILE, JSON.stringify(auth, null, 2), { mode: 0o600 })
}

export function getBaseUrl(): string {
  const config = loadConfig()
  const url = config.base_url || process.env.SMARTCLOUD_BASE_URL
  if (!url) {
    console.error('Error: No base URL configured. Run: smartcloud config --base-url <url>')
    process.exit(1)
  }
  return url
}

export function getAccessToken(): string {
  const token = process.env.SMARTCLOUD_TOKEN || loadAuth().access_token
  if (!token) {
    console.error('Error: Not logged in. Run: smartcloud login')
    process.exit(1)
  }
  return token
}

export function getProjectId(option?: string): string {
  const id = option || process.env.SMARTCLOUD_PROJECT || loadConfig().default_project
  if (!id) {
    console.error('Error: No project specified. Use -p <project_id> or set a default with: smartcloud config --default-project <id>')
    process.exit(1)
  }
  return id
}
