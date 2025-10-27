import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify the user is authenticated and is an admin
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || roleData?.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can update user roles')
    }

    // Get the request body
    const { userId, newRole } = await req.json()

    if (!userId || !newRole) {
      throw new Error('Missing required fields: userId and newRole')
    }

    // Validate role
    const validRoles = ['admin', 'gerant', 'commercial', 'comptable', 'production']
    if (!validRoles.includes(newRole)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`)
    }

    // Use service role client to update the role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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
      console.error('Error updating role:', updateError)
      throw updateError
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
        message: `Role updated successfully from ${oldRole} to ${newRole}`,
        oldRole,
        newRole
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})