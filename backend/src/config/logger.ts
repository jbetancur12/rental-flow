import winston from 'winston';
// 1. Imports actualizados según la documentación
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";

import dotenv from 'dotenv';
dotenv.config();

// 2. Crea el cliente de Logtail
const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN || '', {
  endpoint: 'https://in.logs.betterstack.com',
});


const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'rentflow-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    
    // 3. Añade el nuevo transporte, pasándole el cliente
    new LogtailTransport(logtail),
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export { logger, logtail };