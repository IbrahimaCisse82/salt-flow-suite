import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getCorsHeaders } from '../_shared/cors.ts';

interface ScheduledReport {
  id: string;
  tenant_id: string;
  report_type: 'campagne' | 'financier' | 'production' | 'rh' | 'commercial';
  recipient_emails: string[];
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // --- Authentication ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Validate caller identity
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const userId = claims.claims.sub as string;

    // --- Authorization: check role ---
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get profile for tenant_id
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('tenant_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profil introuvable' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // SECURITY: Get role from user_roles table (not profiles)
    const { data: roleData } = await serviceClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    const userRole = roleData?.role;
    const allowedRoles = ['admin', 'gerant', 'comptable'];
    if (!userRole || !allowedRoles.includes(userRole)) {
      return new Response(
        JSON.stringify({ error: 'Permissions insuffisantes' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // --- Business logic: only process reports for caller's tenant ---
    const tenantFilter = userRole === 'admin' ? {} : { tenant_id: profile.tenant_id };

    let query = serviceClient
      .from('scheduled_reports')
      .select('*')
      .eq('is_active', true)
      .lte('next_run_at', new Date().toISOString())
      .order('next_run_at');

    if (tenantFilter.tenant_id) {
      query = query.eq('tenant_id', tenantFilter.tenant_id);
    }

    const { data: reports, error: reportsError } = await query;

    if (reportsError) {
      throw reportsError;
    }

    const results = [];

    for (const report of reports || []) {
      try {
        const reportData = await generateReport(serviceClient, report);

        await serviceClient
          .from('scheduled_reports')
          .update({ last_run_at: new Date().toISOString() })
          .eq('id', report.id);

        results.push({
          report_id: report.id,
          status: 'success',
          data: reportData
        });
      } catch (error) {
        console.error(`Error generating report ${report.id}:`, error);
        results.push({
          report_id: report.id,
          status: 'error',
          error: 'Erreur lors de la génération'
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in generate-scheduled-report:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur interne' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function generateReport(supabaseClient: any, report: ScheduledReport) {
  const { tenant_id, report_type } = report;

  switch (report_type) {
    case 'campagne':
      return await generateCampaignReport(supabaseClient, tenant_id);
    case 'financier':
      return await generateFinancialReport(supabaseClient, tenant_id);
    case 'production':
      return await generateProductionReport(supabaseClient, tenant_id);
    case 'rh':
      return await generateHRReport(supabaseClient, tenant_id);
    case 'commercial':
      return await generateCommercialReport(supabaseClient, tenant_id);
    default:
      throw new Error(`Unknown report type: ${report_type}`);
  }
}

async function generateCampaignReport(supabaseClient: any, tenantId: string) {
  const { data: campagnes } = await supabaseClient
    .from('campagnes')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('year', { ascending: false });

  const { data: production } = await supabaseClient
    .from('production_records')
    .select('quantity')
    .eq('tenant_id', tenantId);

  const totalProduction = production?.reduce((sum: number, p: any) => sum + Number(p.quantity || 0), 0) || 0;

  return {
    type: 'campagne',
    campagnes_count: campagnes?.length || 0,
    total_production: totalProduction,
    campagnes
  };
}

async function generateFinancialReport(supabaseClient: any, tenantId: string) {
  const { data: transactions } = await supabaseClient
    .from('transactions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('date', { ascending: false })
    .limit(100);

  const revenue = transactions?.filter((t: any) => ['vente_locale', 'vente_export'].includes(t.transaction_type))
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0) || 0;
  
  const expenses = transactions?.filter((t: any) => t.transaction_type === 'depense')
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0) || 0;

  return {
    type: 'financier',
    total_revenue: revenue,
    total_expenses: expenses,
    net_result: revenue - expenses,
    transactions_count: transactions?.length || 0
  };
}

async function generateProductionReport(supabaseClient: any, tenantId: string) {
  const { data: production } = await supabaseClient
    .from('production_records')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('production_date', { ascending: false })
    .limit(50);

  const totalProduction = production?.reduce((sum: number, p: any) => sum + Number(p.quantity || 0), 0) || 0;
  const avgQuality = production?.reduce((sum: number, p: any) => sum + Number(p.quality_grade || 0), 0) / (production?.length || 1);

  return {
    type: 'production',
    total_production: totalProduction,
    average_quality: avgQuality,
    records_count: production?.length || 0
  };
}

async function generateHRReport(supabaseClient: any, tenantId: string) {
  const { data: employees } = await supabaseClient
    .from('employees')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  const totalSalary = employees?.reduce((sum: number, e: any) => sum + Number(e.salary || 0), 0) || 0;

  return {
    type: 'rh',
    active_employees: employees?.length || 0,
    total_salary: totalSalary
  };
}

async function generateCommercialReport(supabaseClient: any, tenantId: string) {
  const { data: sales } = await supabaseClient
    .from('sales')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sale_date', { ascending: false })
    .limit(50);

  const totalRevenue = sales?.reduce((sum: number, s: any) => sum + Number(s.total_amount || 0), 0) || 0;
  const totalQuantity = sales?.reduce((sum: number, s: any) => sum + Number(s.quantity || 0), 0) || 0;

  return {
    type: 'commercial',
    total_revenue: totalRevenue,
    total_quantity: totalQuantity,
    sales_count: sales?.length || 0
  };
}
