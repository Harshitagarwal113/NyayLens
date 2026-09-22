import app from './app';
// Triggering restart
import { env } from './config/env';
import { User } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

import https from 'https';
import http from 'http';

const startServer = () => {
  try {
    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      
      // Ping the server every 14 minutes to prevent Render free-tier cold starts
      const serverUrl = process.env.RENDER_EXTERNAL_URL;
      if (serverUrl) {
        console.log(`[KeepAlive] Registered keep-alive interval for ${serverUrl}`);
        setInterval(() => {
          const client = serverUrl.startsWith('https') ? https : http;
          client.get(serverUrl, (resp) => {
            if (resp.statusCode === 200) {
              console.log(`[KeepAlive] Successfully pinged self at ${new Date().toISOString()}`);
            }
          }).on("error", (err) => {
            console.error('[KeepAlive] Error pinging self:', err.message);
          });
        }, 14 * 60 * 1000); // 14 minutes
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
