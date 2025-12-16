import React, { useEffect, useState } from 'react';
import { Profile, Payment } from '../types';
import { getPayments, generateMercadoPagoPix } from '../services/dataService';
import { supabase } from '../utils/supabaseClient';
import { Copy, Wallet, XCircle, CheckCircle2, AlertTriangle, Terminal } from '../components/ui/Icons';
import { useToast } from '../context/ToastContext';

interface Props {
  user: Profile;
}

export const StudentFinance: React.FC<Props> = ({ user }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [generatingPix, setGeneratingPix] = useState(false);
  
  // LOG SYSTEM STATE
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const { addToast } = useToast();

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev]);
  };

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
             addLog("Webhook confirmou pagamento.");
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
    setLogs([]); // Limpa logs anteriores
    setShowLogs(false);
    
    // Se ainda não tem QR Code, gerar no Mercado Pago
    if (!payment.qr_code && payment.status === 'pending') {
      setGeneratingPix(true);
      addLog(`Iniciando geração de Pix para ID: ${payment.id}`);
      
      try {
        addLog("Chamando API /api/create-pix...");
        
        // Assume student email mock for MVP, in real app use user.email
        const updatedPayment = await generateMercadoPagoPix(payment.id, "email@aluno.com");
        
        addLog("Sucesso! QR Code recebido.");
        
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
        const errorMsg = error.message || "Erro desconhecido";
        addLog(`ERRO FATAL: ${errorMsg}`);
        addToast(errorMsg, "error");
        setShowLogs(true); // Mostra logs automaticamente em caso de erro
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
        <h2 className="text-3xl font-black text-white tracking-tight">Minhas<br/><span className="text-primary-400">Finanças</span></h2>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2].map(i => <div key={i} className="h-24 bg-surface rounded-2xl animate-pulse"></div>)}
        </div>
      ) : (
        <div className="space-y-4 pb-20">
          {payments.length === 0 && (
            <div className="text-center py-10 text-zinc-500">
              <Wallet size={48} className="mx-auto mb-3 opacity-20" />
              Nenhuma fatura encontrada.
            </div>
          )}
          
          {payments.map(item => (
            <div key={item.id} className="bg-surface p-4 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">{item.description}</p>
                <p className="text-xs text-zinc-500">Vence em: {new Date(item.due_date).toLocaleDateString('pt-BR')}</p>
                <p className="text-sm font-bold text-primary-400 mt-1">
                  R$ {Number(item.amount).toFixed(2).replace('.', ',')}
                </p>
              </div>
              
              <div>
                {item.status === 'paid' ? (
                  <span className="bg-green-900/30 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-900/50 flex items-center gap-1">
                    <CheckCircle2 size={12} /> PAGO
                  </span>
                ) : (
                  <button 
                    onClick={() => handlePayClick(item)}
                    className="bg-primary-500 text-black text-xs font-bold px-4 py-2 rounded-xl hover:bg-primary-400 active:scale-95 transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface w-full max-w-sm rounded-3xl p-6 border border-white/10 relative max-h-[90vh] overflow-y-auto flex flex-col">
            <button 
              onClick={() => setSelectedPayment(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <XCircle size={24} />
            </button>

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-1">
                {selectedPayment.status === 'paid' ? 'Pagamento Recebido!' : 'Pagamento via Pix'}
              </h3>
              <p className="text-zinc-400 text-sm">{selectedPayment.description}</p>
              <p className="text-2xl font-black text-primary-400 mt-2">
                R$ {selectedPayment.amount.toFixed(2).replace('.', ',')}
              </p>
            </div>

            {selectedPayment.status === 'paid' ? (
               <div className="flex flex-col items-center justify-center py-10">
                 <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                   <CheckCircle2 size={48} className="text-green-500" />
                 </div>
                 <p className="text-white font-bold">Tudo certo!</p>
                 <p className="text-zinc-500 text-sm">Seu pagamento foi confirmado.</p>
               </div>
            ) : (
              <>
                {generatingPix ? (
                   <div className="flex flex-col items-center py-10">
                     <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                     <p className="text-zinc-400 text-sm animate-pulse">Gerando QR Code no Mercado Pago...</p>
                     <p className="text-zinc-600 text-xs mt-2">Isso pode levar alguns segundos...</p>
                   </div>
                ) : (
                  <>
                    <div className="flex justify-center mb-6 bg-white p-4 rounded-xl relative overflow-hidden min-h-[160px]">
                       {selectedPayment.qr_code_base64 ? (
                         <img 
                           src={`data:image/png;base64,${selectedPayment.qr_code_base64}`} 
                           className="relative z-10 w-full h-auto object-contain" 
                           alt="Pix QR Code"
                         />
                       ) : (
                         <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center p-4">
                           <AlertTriangle className="text-red-500 mb-2" size={32} />
                           <p className="text-zinc-900 font-bold text-sm">Não foi possível gerar o QR Code.</p>
                           <p className="text-zinc-500 text-xs mt-1">Veja os logs abaixo para detalhes.</p>
                           <button 
                             onClick={() => handlePayClick(selectedPayment)}
                             className="mt-3 bg-zinc-900 text-white text-xs px-3 py-1.5 rounded-lg"
                           >
                             Tentar Novamente
                           </button>
                         </div>
                       )}
                    </div>

                    {selectedPayment.qr_code && (
                      <div className="mb-6">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 mb-2 block">Pix Copia e Cola</label>
                        <div 
                          onClick={() => copyToClipboard(selectedPayment.qr_code)}
                          className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
                        >
                          <span className="text-xs text-zinc-300 truncate mr-2 font-mono">
                            {selectedPayment.qr_code}
                          </span>
                          <Copy size={16} className="text-primary-400 shrink-0" />
                        </div>
                      </div>
                    )}
                    
                    {selectedPayment.qr_code && (
                      <div className="text-center p-3 bg-blue-900/20 border border-blue-900/50 rounded-xl mb-4">
                        <p className="text-blue-200 text-xs animate-pulse">
                          Aguardando confirmação automática do banco...
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* DEBUG LOG SECTION */}
                <div className="mt-4 border-t border-white/5 pt-4">
                   <button 
                     onClick={() => setShowLogs(!showLogs)} 
                     className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase font-bold tracking-widest hover:text-white mb-2"
                   >
                     <Terminal size={12} />
                     {showLogs ? 'Ocultar Logs' : 'Ver Logs de Erro'}
                   </button>
                   
                   {showLogs && (
                     <div className="bg-black/50 p-3 rounded-xl border border-white/5 h-32 overflow-y-auto font-mono text-[10px]">
                       {logs.length === 0 && <span className="text-zinc-600">Nenhum log registrado.</span>}
                       {logs.map((log, i) => (
                         <div key={i} className={`mb-1 border-b border-white/5 pb-1 ${log.includes('ERRO') ? 'text-red-400' : 'text-zinc-400'}`}>
                           {log}
                         </div>
                       ))}
                     </div>
                   )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};