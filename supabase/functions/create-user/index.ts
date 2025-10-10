import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'
import { getCorsHeaders } from '../_shared/cors.ts'
import { logger } from '../_shared/logger.ts'

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  
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

    // Get the authorization header (optional for initial signup)
    const authHeader = req.headers.get('Authorization')
    let tenantId: string | null = null
    let isAdmin = false

    // If there's an authorization header, get the tenant_id and role from the creating user
    if (authHeader) {
      const userClient = createClient(supabaseUrl, serviceKey, {
        global: { headers: { Authorization: authHeader } }
      })
      
      const { data: { user: creatingUser }, error: userError } = await userClient.auth.getUser()
      if (!userError && creatingUser) {
        // Get tenant_id from the creating user's profile
        const { data: profile } = await admin
          .from('profiles')
          .select('tenant_id')
          .eq('id', creatingUser.id)
          .single()

        if (profile?.tenant_id) {
          tenantId = profile.tenant_id
        }

        // Check if creating user is admin
        const { data: adminRole } = await admin
          .from('user_roles')
          .select('id')
          .eq('user_id', creatingUser.id)
          .eq('role', 'admin')
          .maybeSingle()

        if (adminRole) {
          isAdmin = true
        }
      }
    }

    // Determine final role based on auth context
    // Self-signup: allow 'gerant' (creating their own company)
    // Invited by admin: allow any role
    // Invited by non-admin: only allow non-privileged roles
    const isSelfSignup = !authHeader
    let finalRole = role
    
    if (!isSelfSignup && !isAdmin && role === 'admin') {
      // Only admins can assign 'admin' role
      finalRole = 'production'
    } else if (!isSelfSignup && !isAdmin && role === 'gerant') {
      // Non-admins can't invite other gerants
      finalRole = 'production'
    }

    // Crée l'utilisateur sans envoi d'email (confirmation forcée)
    const userMetadata: any = {
      full_name: sanitizedFullName,
      role: finalRole,
    }

    // Add tenant_id to metadata if available (for invite scenario)
    if (tenantId) {
      userMetadata.tenant_id = tenantId
    }

    const { data, error } = await admin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: userMetadata,
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