export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Secret {
  id: string
  project_id: string
  user_id: string
  key_name: string
  encrypted_value: string
  iv: string
  auth_tag: string
  description: string | null
  created_at: string
  updated_at: string
}

// Returned to clients — never includes encrypted fields
export interface SecretMetadata {
  id: string
  project_id: string
  key_name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface AccessLog {
  id: string
  secret_id: string
  user_id: string
  project_id: string
  key_name: string
  action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE'
  ip_address: string | null
  accessed_at: string
}

// API request/response shapes
export interface CreateSecretRequest {
  project_id: string
  key_name: string
  value: string
  description?: string
}

export interface UpdateSecretRequest {
  value?: string
  description?: string
}

export interface FetchSecretRequest {
  project_id: string
  key_name: string
}

export interface FetchSecretResponse {
  key_name: string
  value: string
  project_id: string
  secret_id: string
  fetched_at: string
}

export interface ApiError {
  error: string
}
