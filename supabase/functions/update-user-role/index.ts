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

    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    })

    // Verify the user is authenticated and is an admin
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || roleData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Non autorisé - seuls les admins peuvent modifier les rôles' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the request body
    const { userId, newRole } = await req.json()

    if (!userId || !newRole) {
      return new Response(
        JSON.stringify({ error: 'Champs requis manquants: userId et newRole' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate role
    const validRoles = ['admin', 'gerant', 'commercial', 'comptable', 'production']
    if (!validRoles.includes(newRole)) {
      return new Response(
        JSON.stringify({ error: `Rôle invalide. Doit être l'un de: ${validRoles.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use service role client to update the role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Get current role
    const { data: currentRoleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()

    const oldRole = currentRoleData?.role || 'none'

    // Update or insert the role
    const { error: updateError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: newRole,
        assigned_by: user.id,
        assigned_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,role'
      })

    if (updateError) {
      logger.error('Error updating role:', updateError)
      return new Response(
        JSON.stringify({ error: 'Impossible de mettre à jour le rôle' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log the role change in security audit log
    await supabaseAdmin
      .from('security_audit_log')
      .insert({
        user_id: userId,
        changed_by: user.id,
        action: 'role_updated',
        old_value: oldRole,
        new_value: newRole,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent')
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Rôle mis à jour de ${oldRole} à ${newRole}`,
        oldRole,
        newRole
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    logger.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})