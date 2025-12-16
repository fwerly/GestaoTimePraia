// Esta função roda no servidor (Vercel Serverless Function)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lcyjcuqugpkerkmxduqv.supabase.co';
// IMPORTANTE: Em ambiente server-side, usamos a Service Role Key para ler configurações protegidas por RLS
// Substitua pela sua chave Service Role real no Vercel Environment Variables como SUPABASE_SERVICE_ROLE_KEY
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey!);

// TOKEN DE PRODUÇÃO (Hardcoded conforme solicitado)
const MERCADO_PAGO_ACCESS_TOKEN = 'APP_USR-5165598701794197-121612-8cecb803683ec49d9984cb40625c67fd-91598504';

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { paymentId, email } = await request.json();

    // 1. Fetch Payment Details
    const { data: payment, error: pError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (pError || !payment) throw new Error('Payment not found');

    // 2. Usando Token Hardcoded (Não consulta mais o banco)
    const accessToken = MERCADO_PAGO_ACCESS_TOKEN;

    // 3. Call Mercado Pago API
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': paymentId 
      },
      body: JSON.stringify({
        transaction_amount: Number(payment.amount),
        description: payment.description,
        payment_method_id: 'pix',
        payer: {
          email: email || 'student@gestaotime.com', 
          first_name: 'Aluno',
          last_name: 'GestaoTime'
        },
        notification_url: `https://${request.headers.get('host')}/api/webhook`
      })
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('MP Error:', mpData);
      throw new Error(mpData.message || 'Error creating Pix');
    }

    // 4. Update Database with QR Code
    const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64;
    const mpId = mpData.id.toString();

    await supabase
      .from('payments')
      .update({
        external_id: mpId,
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        status: 'processing'
      })
      .eq('id', paymentId);

    return new Response(JSON.stringify({ qr_code: qrCode, qr_code_base64: qrCodeBase64 }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}