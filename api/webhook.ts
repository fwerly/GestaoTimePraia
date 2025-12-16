import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://lcyjcuqugpkerkmxduqv.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjeWpjdXF1Z3BrZXJrbXhkdXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NTg2MDcsImV4cCI6MjA4MTMzNDYwN30.oaUtL3Q6_m5rE1jgY2eY44D0PlbP_mw38tA9ss3Q3w0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MERCADO_PAGO_ACCESS_TOKEN = 'APP_USR-5165598701794197-121612-8cecb803683ec49d9984cb40625c67fd-91598504';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    // URLSearchParams não funciona direto no req.url em funções node-like do Vercel da mesma forma que Web API
    // Usamos req.query fornecido pelo Vercel
    const { topic, id, type, 'data.id': dataId } = req.query;
    
    const notificationTopic = topic || type;
    const notificationId = id || dataId;

    if (notificationTopic === 'payment' && notificationId) {
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${notificationId}`, {
        headers: { 'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}` }
      });
      
      if (mpResponse.ok) {
        const paymentData = await mpResponse.json();
        
        if (paymentData.status === 'approved') {
          await supabase
            .from('payments')
            .update({ status: 'paid' })
            .eq('external_id', notificationId.toString());
        }
      }
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Error');
  }
}