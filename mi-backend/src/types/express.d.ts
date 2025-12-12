// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Request } from 'express';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: 'arbitro' | 'organizador';
      canchaAsignada?: string;
    }
    
    interface Request {
      user?: User;
      userId?: string;
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
    }
  }
}

export {};
