export class SmartCloudError extends Error {
  public readonly statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'SmartCloudError'
    this.statusCode = statusCode
  }
}

export class AuthenticationError extends SmartCloudError {
  constructor(message = 'Authentication failed') {
    super(message, 401)
    this.name = 'AuthenticationError'
  }
}

export class SecretNotFoundError extends SmartCloudError {
  constructor(keyName?: string) {
    super(keyName ? `Secret not found: ${keyName}` : 'Secret not found', 404)
    this.name = 'SecretNotFoundError'
  }
}

export class NetworkError extends SmartCloudError {
  constructor(message: string) {
    super(message, 0)
    this.name = 'NetworkError'
  }
}
