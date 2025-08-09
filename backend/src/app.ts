import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import vpnRoutes from './routes/vpn';
import vpnClientRoutes from './routes/vpnClients';
import inviteRoutes from './routes/invites';
import settingsRoutes from './routes/settings';
import billingRoutes from './routes/billing';
import oauthRoutes from './routes/oauth';
import { cronService } from './services/CronService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://vpnconsoleoutline.tw1.ru']
    : ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VPN Manager API',
      version: '1.0.0',
      description: 'API for managing VPN access keys with OAuth 2.0 provider',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? 'https://vpnconsoleoutline.tw1.ru/api'
          : `http://localhost:${PORT}/api`,
        description: process.env.NODE_ENV === 'production' 
          ? 'Production server'
          : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        oauth2: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: '/api/oauth/authorize',
              tokenUrl: '/api/oauth/token',
              scopes: {
                read: 'Read access to VPN keys',
                write: 'Write access to VPN keys',
                admin: 'Admin access'
              }
            }
          }
        }
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vpn', vpnRoutes);
app.use('/api/vpn-clients', vpnClientRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/oauth', oauthRoutes);

// OAuth discovery endpoint
app.get('/.well-known/oauth-authorization-server', (req, res) => {
  res.json({
    issuer: `http://localhost:${PORT}`,
    authorization_endpoint: `http://localhost:${PORT}/api/oauth/authorize`,
    token_endpoint: `http://localhost:${PORT}/api/oauth/token`,
    userinfo_endpoint: `http://localhost:${PORT}/api/oauth/userinfo`,
    revocation_endpoint: `http://localhost:${PORT}/api/oauth/revoke`,
    scopes_supported: ['read', 'write', 'admin'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic']
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🔍 OAuth Discovery: http://localhost:${PORT}/.well-known/oauth-authorization-server`);
  
  // Start cron jobs
  cronService.startBillingJob();
  console.log(`⏰ Billing cron job started (daily at 02:00 AM)`);
});

export default app;