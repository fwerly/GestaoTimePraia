// Webhook endpoint called by Mercado Pago
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lcyjcuqugpkerkmxduqv.supabase.co';
// IMPORTANTE: Service Role Key para backend
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey!);

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const topic = url.searchParams.get('topic') || url.searchParams.get('type');
    const id = url.searchParams.get('id') || url.searchParams.get('data.id');

    if (topic === 'payment') {
      const { data: config } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'mp_access_token')
        .single();
      
      if (!config?.value) return new Response('Config missing', { status: 500 });

      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { 'Authorization': `Bearer ${config.value}` }
      });
      
      if (mpResponse.ok) {
        const paymentData = await mpResponse.json();
        
        if (paymentData.status === 'approved') {
          const { error } = await supabase
            .from('payments')
            .update({ status: 'paid' })
            .eq('external_id', id);
            
          if (error) console.error('Supabase Update Error', error);
        }
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Internal Error', { status: 500 });
  }
}