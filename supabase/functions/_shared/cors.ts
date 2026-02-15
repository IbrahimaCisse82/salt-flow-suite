// SECURITY: Restrict CORS to specific domains in production
// Update this array with your actual production domains
const ALLOWED_ORIGINS = [
  'http://localhost:5173', // Development
  'http://localhost:8080', // Development
  'https://mwxybozfksdxrsipywlh.supabase.co', // Supabase
  'https://a879894c-887f-41e8-9be4-ab73e08c3d84.lovableproject.com', // Lovable Production
  'https://g-suitesel.lovable.app', // Lovable Published
  'https://sel.g-suiteapp.com', // Custom domain
  'https://www.sel.g-suiteapp.com', // Custom domain with www
  'https://g-suiteapp.com', // Custom domain root
  'https://www.g-suiteapp.com', // Custom domain root with www
];

// SECURITY: Get proper CORS headers based on origin
// Returns origin-specific headers for allowed origins, default headers otherwise
export const getCorsHeaders = (origin?: string | null): Record<string, string> => {
  // Allow Lovable preview URLs (dynamic subdomains)
  const isLovablePreview = origin && origin.endsWith('.lovable.app');
  
  if (origin && (ALLOWED_ORIGINS.includes(origin) || isLovablePreview)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
      'Access-Control-Allow-Credentials': 'true',
    };
  }
  
  // Default to first allowed origin for security
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Credentials': 'false',
  };
};

// Backward compatibility - deprecated, use getCorsHeaders instead
export const corsHeaders = getCorsHeaders();
