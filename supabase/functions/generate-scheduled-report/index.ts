import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface ScheduledReport {
  id: string;
  tenant_id: string;
  report_type: 'campagne' | 'financier' | 'production' | 'rh' | 'commercial';
  recipient_emails: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Récupérer les rapports à exécuter maintenant
    const { data: reports, error: reportsError } = await supabaseClient
      .from('scheduled_reports')
      .select('*')
      .eq('is_active', true)
      .lte('next_run_at', new Date().toISOString())
      .order('next_run_at');

    if (reportsError) {
      throw reportsError;
    }

    console.log(`Found ${reports?.length || 0} reports to generate`);

    const results = [];

    for (const report of reports || []) {
      try {
        // Générer le rapport selon le type
        const reportData = await generateReport(supabaseClient, report);

        // Envoyer par email (simulation - vous pouvez intégrer un service d'email)
        console.log(`Report generated for tenant ${report.tenant_id}`, {
          type: report.report_type,
          recipients: report.recipient_emails
        });

        // Mettre à jour last_run_at et calculer next_run_at
        await supabaseClient
          .from('scheduled_reports')
          .update({
            last_run_at: new Date().toISOString()
          })
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
          error: error instanceof Error ? error.message : 'Unknown error'
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
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function generateReport(supabaseClient: any, report: ScheduledReport) {
  const { tenant_id, report_type } = report;

  // Récupérer les données selon le type de rapport
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
