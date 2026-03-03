export interface SmartCloudClientOptions {
  baseUrl: string
  accessToken?: string
  email?: string
  password?: string
}

export interface SecretValue {
  key_name: string
  value: string
  project_id: string
  secret_id: string
  fetched_at: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface LoginResponse {
  session: {
    access_token: string
    refresh_token: string
  }
}

export interface FetchSecretResponse {
  key_name: string
  value: string
  project_id: string
  secret_id: string
  fetched_at: string
}

export interface FetchAllSecretsResponse {
  secrets: { key_name: string; value: string }[]
  project_id: string
  fetched_at: string
}

export interface ProjectsResponse {
  projects: Project[]
}
