export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || '0.0.0.0',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-in-prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-change-in-prod',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },
});
