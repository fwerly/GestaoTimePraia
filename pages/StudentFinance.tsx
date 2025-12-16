import React, { useEffect, useState } from 'react';
import { Profile, Payment } from '../types';
import { getPayments, generateMercadoPagoPix } from '../services/dataService';
import { supabase } from '../utils/supabaseClient';
import { Copy, Wallet, XCircle, CheckCircle2, AlertTriangle } from '../components/ui/Icons';
import { useToast } from '../context/ToastContext';

interface Props {
  user: Profile;
}

export const StudentFinance: React.FC<Props> = ({ user }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [generatingPix, setGeneratingPix] = useState(false);
  
  const { addToast } = useToast();

  useEffect(() => {
    loadData();

    // Realtime subscription to update status instantly
    const channel = supabase
      .channel('public:payments')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'payments' }, (payload) => {
        const updated = payload.new as Payment;
        // Update list
        setPayments(current => current.map(p => p.id === updated.id ? updated : p));
        // Update modal if open
        if (selectedPayment?.id === updated.id) {
          setSelectedPayment(prev => prev ? { ...prev, status: updated.status } : null);
          if (updated.status === 'paid') {
             addToast("Pagamento Confirmado Automaticamente! 🚀", "success");
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedPayment]);

  const loadData = async () => {
    setLoading(true);
    const data = await getPayments('student', user.id);
    setPayments(data);
    setLoading(false);
  };

  const handlePayClick = async (payment: Payment) => {
    setSelectedPayment(payment);
    
    // Se ainda não tem QR Code, gerar no Mercado Pago
    if (!payment.qr_code && payment.status === 'pending') {
      setGeneratingPix(true);
      
      try {
        // Assume student email mock for MVP, in real app use user.email
        const updatedPayment = await generateMercadoPagoPix(payment.id, "email@aluno.com");
        
        setSelectedPayment(prev => prev ? { 
          ...prev, 
          qr_code: updatedPayment.qr_code, 
          qr_code_base64: updatedPayment.qr_code_base64 
        } : null);
        
        // Refresh list to save local state
        setPayments(prev => prev.map(p => p.id === payment.id ? {
          ...p,
          qr_code: updatedPayment.qr_code,
          qr_code_base64: updatedPayment.qr_code_base64 
        } : p));

      } catch (error: any) {
        const errorMsg = error.message || "Erro ao gerar Pix.";
        console.error(error);
        addToast(errorMsg, "error");
      } finally {
        setGeneratingPix(false);
      }
    }
  };

  const copyToClipboard = (text?: string) => {
    if(!text) return;
    navigator.clipboard.writeText(text);
    addToast("Código Pix copiado!", "success");
  };

  return (
    <div>
      <div className="mb-8 px-1">
        <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase drop-shadow-lg">Minhas<br/><span className="text-primary-500">Finanças</span></h2>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2].map(i => <div key={i} className="h-24 bg-zinc-900/40 rounded-2xl animate-pulse border border-white/5"></div>)}
        </div>
      ) : (
        <div className="space-y-4 pb-20">
          {payments.length === 0 && (
            <div className="text-center py-10 text-zinc-500">
              <div className="w-20 h-20 bg-black/40 rounded-full flex items-center justify-center mx-auto mb-3 border border-white/5">
                <Wallet size={32} className="opacity-50" />
              </div>
              Nenhuma fatura encontrada.
            </div>
          )}
          
          {payments.map(item => (
            <div key={item.id} className="bg-zinc-900/40 backdrop-blur-md p-4 rounded-3xl border border-white/5 flex items-center justify-between shadow-lg hover:bg-zinc-900/60 transition-colors">
              <div>
                <p className="font-bold text-white tracking-wide">{item.description}</p>
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Vence em: {new Date(item.due_date).toLocaleDateString('pt-BR')}</p>
                <p className="text-xl font-black italic text-primary-400 mt-1">
                  R$ {Number(item.amount).toFixed(2).replace('.', ',')}
                </p>
              </div>
              
              <div>
                {item.status === 'paid' ? (
                  <span className="bg-green-900/20 text-green-400 text-[10px] font-black italic uppercase px-3 py-1.5 rounded-lg border border-green-500/20 flex items-center gap-1 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                    <CheckCircle2 size={12} /> PAGO
                  </span>
                ) : (
                  <button 
                    onClick={() => handlePayClick(item)}
                    className="bg-primary-500 text-black text-[10px] font-black italic uppercase tracking-wider px-4 py-3 rounded-xl hover:bg-primary-400 active:scale-95 transition-all shadow-[0_0_15px_rgba(132,204,22,0.3)]"
                  >
                    Pagar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in">
          <div className="bg-zinc-900/90 w-full max-w-sm rounded-3xl p-6 border border-white/10 relative max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
            <button 
              onClick={() => setSelectedPayment(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <XCircle size={24} />
            </button>

            <div className="text-center mb-6">
              <h3 className="text-xl font-black italic text-white mb-1 uppercase tracking-wide">
                {selectedPayment.status === 'paid' ? 'Pagamento Recebido!' : 'Pagamento Pix'}
              </h3>
              <p className="text-zinc-400 text-sm font-medium">{selectedPayment.description}</p>
              <p className="text-3xl font-black italic text-primary-400 mt-2 tracking-tighter drop-shadow-[0_0_10px_rgba(132,204,22,0.5)]">
                R$ {selectedPayment.amount.toFixed(2).replace('.', ',')}
              </p>
            </div>

            {selectedPayment.status === 'paid' ? (
               <div className="flex flex-col items-center justify-center py-10">
                 <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                   <CheckCircle2 size={48} className="text-green-500" />
                 </div>
                 <p className="text-white font-bold uppercase tracking-wide">Tudo certo!</p>
                 <p className="text-zinc-500 text-sm">Seu pagamento foi confirmado.</p>
               </div>
            ) : (
              <>
                {generatingPix ? (
                   <div className="flex flex-col items-center py-10">
                     <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                     <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest animate-pulse">Gerando QR Code...</p>
                   </div>
                ) : (
                  <>
                    <div className="flex justify-center mb-6 bg-white p-4 rounded-2xl relative overflow-hidden min-h-[160px] shadow-inner">
                       {selectedPayment.qr_code_base64 ? (
                         <img 
                           src={`data:image/png;base64,${selectedPayment.qr_code_base64}`} 
                           className="relative z-10 w-full h-auto object-contain mix-blend-multiply" 
                           alt="Pix QR Code"
                         />
                       ) : (
                         <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center p-4">
                           <AlertTriangle className="text-red-500 mb-2" size={32} />
                           <p className="text-zinc-900 font-bold text-sm">Não foi possível gerar o QR Code.</p>
                           <button 
                             onClick={() => handlePayClick(selectedPayment)}
                             className="mt-3 bg-black text-white text-xs px-3 py-1.5 rounded-lg uppercase font-bold"
                           >
                             Tentar Novamente
                           </button>
                         </div>
                       )}
                    </div>

                    {selectedPayment.qr_code && (
                      <div className="mb-6">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 mb-2 block tracking-widest pl-1">Pix Copia e Cola</label>
                        <div 
                          onClick={() => copyToClipboard(selectedPayment.qr_code)}
                          className="bg-black/40 border border-zinc-700 rounded-xl p-3 flex items-center justify-between cursor-pointer active:scale-95 transition-transform hover:border-primary-500/50"
                        >
                          <span className="text-xs text-zinc-300 truncate mr-2 font-mono">
                            {selectedPayment.qr_code}
                          </span>
                          <Copy size={16} className="text-primary-400 shrink-0" />
                        </div>
                      </div>
                    )}
                    
                    {selectedPayment.qr_code && (
                      <div className="text-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-4">
                        <p className="text-blue-300 text-[10px] font-bold uppercase tracking-wide animate-pulse">
                          Aguardando confirmação automática do banco...
                        </p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};