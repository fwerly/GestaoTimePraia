import { createClient } from '@supabase/supabase-js';

// Hardcoded keys para garantir funcionamento sem configuração de ENV na Vercel (para este MVP)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://lcyjcuqugpkerkmxduqv.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjeWpjdXF1Z3BrZXJrbXhkdXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NTg2MDcsImV4cCI6MjA4MTMzNDYwN30.oaUtL3Q6_m5rE1jgY2eY44D0PlbP_mw38tA9ss3Q3w0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MERCADO_PAGO_ACCESS_TOKEN = 'APP_USR-5165598701794197-121612-8cecb803683ec49d9984cb40625c67fd-91598504';

export default async function handler(req: any, res: any) {
  // CORS setup (opcional, Vercel geralmente lida com isso se estiver na mesma origem)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { paymentId, email } = req.body;

    // 1. Buscar detalhes do pagamento
    const { data: payment, error: pError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (pError || !payment) {
      console.error("Payment fetch error:", pError);
      throw new Error('Pagamento não encontrado no sistema.');
    }

    // 2. Criar preferência no Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
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
        notification_url: `https://${req.headers.host}/api/webhook`
      })
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("MP Error:", mpData);
      throw new Error(mpData.message || 'Erro ao comunicar com Mercado Pago');
    }

    // 3. Atualizar pagamento com QR Code
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

    return res.status(200).json({ qr_code: qrCode, qr_code_base64: qrCodeBase64 });

  } catch (error: any) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
}