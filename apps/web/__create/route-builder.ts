import { Hono } from 'hono';
import type { Handler } from 'hono/types';
import updatedFetch from '../src/__create/fetch';

const API_BASENAME = '/api';
const api = new Hono();

if (globalThis.fetch) {
  globalThis.fetch = updatedFetch;
}

// Use Vite's import.meta.glob to find and bundle all route files at build time
const routeModules = import.meta.glob('../src/app/api/**/route.js', { eager: true });

// Helper function to transform file path to Hono route path
function getHonoPath(routePath: string): { name: string; pattern: string }[] {
  // routePath looks like '../src/app/api/business/route.js'
  const parts = routePath
    .replace('../src/app/api/', '')
    .replace('/route.js', '')
    .replace('route.js', '')
    .split('/')
    .filter(Boolean);

  if (parts.length === 0) {
    return [{ name: 'root', pattern: '' }];
  }

  const transformedParts = parts.map((segment) => {
    const match = segment.match(/^\[(\.{3})?([^\]]+)\]$/);
    if (match) {
      const [_, dots, param] = match;
      return dots === '...'
        ? { name: param, pattern: `:${param}{.+}` }
        : { name: param, pattern: `:${param}` };
    }
    return segment === 'index' ? { name: 'index', pattern: '' } : { name: segment, pattern: segment };
  });

  return transformedParts;
}

// Register all routes
export async function registerRoutes() {
  if (api.routes.length > 0) return; // Already registered
  
  console.log('REGISTERING ROUTES FROM GLOB...');
  
  // Clear existing routes (though in production this only runs once)
  api.routes = [];

  for (const path in routeModules) {
    try {
      const route = routeModules[path] as any;
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      
      for (const method of methods) {
        if (route[method]) {
          const parts = getHonoPath(path);
          const honoPath = `/${parts.map(({ pattern }) => pattern).filter(p => p !== '').join('/')}`;
          
          console.log(`REGISTERING ROUTE: ${method} ${honoPath} from ${path}`);
          
          const handler: Handler = async (c) => {
            const params = c.req.param();
            // Since we use eager: true, we use the already imported route
            // Hot reloading in dev is handled by Vite's HMR on this file
            return await route[method](c.req.raw, { params });
          };

          const methodLowercase = method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch';
          api[methodLowercase](honoPath, handler);
        }
      }
    } catch (error) {
      console.error(`Error registering route ${path}:`, error);
    }
  }
}


export { api, API_BASENAME };
