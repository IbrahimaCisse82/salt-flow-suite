import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'
import { corsHeaders } from '../_shared/cors.ts'
import { logger } from '../_shared/logger.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, password, full_name, role = 'gerant' } = await req.json()

    // SECURITY: Input validation and sanitization
    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ error: 'Champs requis manquants' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email) || email.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Format d\'email invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sanitize and validate full_name
    const sanitizedFullName = String(full_name).trim().slice(0, 100)
    if (sanitizedFullName.length === 0 || !/^[a-zA-ZÀ-ÿ\s'-]+$/.test(sanitizedFullName)) {
      return new Response(
        JSON.stringify({ error: 'Nom invalide - utilisez uniquement des lettres, espaces, tirets et apostrophes' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate role
    const validRoles = ['admin', 'gerant', 'commercial', 'comptable', 'production']
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Rôle invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SECURITY: Strong password validation
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Le mot de passe doit contenir au moins 8 caractères' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return new Response(
        JSON.stringify({ error: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceKey)

    // Crée l'utilisateur sans envoi d'email (confirmation forcée)
    const { data, error } = await admin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: sanitizedFullName,
        role,
      },
    })

    if (error) {
      logger.error('create-user error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ user: data.user }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    logger.error('create-user exception:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})