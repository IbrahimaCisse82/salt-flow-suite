// SECURITY: Restrict CORS to specific domains in production
// Update this array with your actual production domains
const ALLOWED_ORIGINS = [
  'http://localhost:5173', // Development
  'http://localhost:8080', // Development
  'https://mwxybozfksdxrsipywlh.supabase.co', // Supabase
  // Add your production domains here:
  // 'https://yourdomain.com',
  // 'https://www.yourdomain.com',
];

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // TODO: Restrict to ALLOWED_ORIGINS in production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to get proper CORS headers based on origin
export const getCorsHeaders = (origin?: string) => {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Credentials': 'true',
    };
  }
  return corsHeaders;
};
