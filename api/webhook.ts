// Webhook endpoint called by Mercado Pago
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lcyjcuqugpkerkmxduqv.supabase.co';
// IMPORTANTE: Service Role Key para backend
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey!);

// TOKEN DE PRODUÇÃO (Hardcoded conforme solicitado)
const MERCADO_PAGO_ACCESS_TOKEN = 'APP_USR-5165598701794197-121612-8cecb803683ec49d9984cb40625c67fd-91598504';

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const topic = url.searchParams.get('topic') || url.searchParams.get('type');
    const id = url.searchParams.get('id') || url.searchParams.get('data.id');

    if (topic === 'payment') {
      // Usando Token Hardcoded diretamente
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { 'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}` }
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