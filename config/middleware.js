import express from 'express';
import cors from 'cors'; // Cross Origin Resource Sharing
import helmet from 'helmet'; // Security
import morgan from 'morgan'; // Request Logger middleware
import compression from 'compression'; // Compression middleware for fetch responses

var app = express();

// Security
const isProduction = process.env.NODE_ENV === 'production';

const self = "'self'";
const bootstrapCDN = 'https://cdn.jsdelivr.net';

const cspDirectives = {
  defaultSrc: [self],
  scriptSrc: [self, bootstrapCDN, "'unsafe-inline'", "'unsafe-eval'"],
  styleSrc: [self, bootstrapCDN, "'unsafe-inline'"],
  fontSrc: [self, bootstrapCDN],
  imgSrc: [self, 'data:', bootstrapCDN],
};

if (isProduction) {
  // Strip unsafe sources in production
  cspDirectives.scriptSrc = [self, bootstrapCDN];
  cspDirectives.styleSrc = [self, bootstrapCDN, "'unsafe-inline'"]; // still needed for Bootstrap
}

export default function setupMiddleware(app) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: cspDirectives,
      },
    })
  );
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.static('public'));
  app.use(compression());
}