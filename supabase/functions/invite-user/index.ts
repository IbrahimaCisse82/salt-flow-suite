import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'
import { getCorsHeaders } from '../_shared/cors.ts'
import { logger } from '../_shared/logger.ts'

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check role: admin OR gerant can invite users
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const callerRole = roleData?.role
    if (callerRole !== 'admin' && callerRole !== 'gerant') {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get caller's tenant
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return new Response(
        JSON.stringify({ error: 'Profil utilisateur non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { email, password, full_name, role } = await req.json()

    // Input validation
    if (!email || !password || !full_name || !role) {
      return new Response(
        JSON.stringify({ error: 'Données manquantes' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email) || email.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Format d\'email invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sanitize full_name
    const sanitizedFullName = String(full_name).trim().slice(0, 100)
    if (sanitizedFullName.length === 0 || !/^[a-zA-ZÀ-ÿ\s'-]+$/.test(sanitizedFullName)) {
      return new Response(
        JSON.stringify({ error: 'Nom invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Password validation
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

    // Role hierarchy: gerant can only create operational roles
    // Admin can create any non-admin role via invite
    const allowedByGerant = ['commercial', 'comptable', 'production']
    const allowedByAdmin = ['gerant', 'commercial', 'comptable', 'production']
    
    const allowedRoles = callerRole === 'admin' ? allowedByAdmin : allowedByGerant
    if (!allowedRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: `Non autorisé - rôle "${role}" non permis` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: sanitizedFullName,
        tenant_id: profile.tenant_id,
        role
      }
    })

    if (createError) {
      logger.error('Erreur création utilisateur:', createError)
      const sanitizedError = createError.message?.includes('duplicate')
        ? 'Un compte avec cet email existe déjà'
        : 'Impossible de créer le compte utilisateur'
      return new Response(
        JSON.stringify({ error: sanitizedError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ data: newUser }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    logger.error('Erreur invite-user:', error)
    return new Response(
      JSON.stringify({ error: 'Une erreur est survenue lors de l\'invitation' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})