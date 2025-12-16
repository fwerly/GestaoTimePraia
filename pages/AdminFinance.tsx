import React, { useEffect, useState } from 'react';
import { Profile, Payment } from '../types';
import { getPayments, createPayment, getStudents, generateMockData } from '../services/dataService';
import { Plus, CheckCircle2, XCircle, User, Database } from '../components/ui/Icons';
import { useToast } from '../context/ToastContext';

interface Props {
  user: Profile;
}

export const AdminFinance: React.FC<Props> = ({ user }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCharge, setShowNewCharge] = useState(false);
  const { addToast } = useToast();

  // New Charge Form
  const [newAmount, setNewAmount] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStudentId, setNewStudentId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [paymentsData, studentsData] = await Promise.all([
      getPayments('admin', user.id),
      getStudents()
    ]);
    setPayments(paymentsData);
    setStudents(studentsData);
    if(studentsData.length > 0) setNewStudentId(studentsData[0].id);
    setLoading(false);
  };

  const handleGenerateData = async () => {
    if(!confirm("Isso criará alunos e cobranças falsas. Continuar?")) return;
    try {
      setLoading(true);
      await generateMockData();
      addToast("Massa de dados gerada!", "success");
      await loadData();
    } catch (e) {
      addToast("Erro ao gerar dados.", "error");
      setLoading(false);
    }
  };

  const handleCreateCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentId) {
      addToast("Selecione um aluno.", "error");
      return;
    }
    try {
      await createPayment({
        student_id: newStudentId,
        amount: parseFloat(newAmount),
        description: newDesc,
        status: 'pending',
        due_date: new Date().toISOString()
      });
      addToast("Cobrança criada!", "success");
      setShowNewCharge(false);
      setNewAmount('');
      setNewDesc('');
      loadData();
    } catch (error) {
      addToast("Erro ao criar cobrança", "error");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-8 px-1">
        <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase drop-shadow-lg">Gestão<br/><span className="text-accent-500">Financeira</span></h1>
        
        <div className="flex gap-2">
          <button 
            onClick={handleGenerateData}
            className="bg-zinc-800/80 text-zinc-400 p-3 rounded-full hover:bg-zinc-700 hover:text-white transition-colors border border-white/5"
            title="Gerar Massa de Dados"
          >
            <Database size={20} />
          </button>
          <button 
            onClick={() => setShowNewCharge(true)}
            className="bg-accent-500 text-white p-3 rounded-full hover:bg-accent-400 border border-accent-400 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {showNewCharge && (
        <div className="bg-zinc-900/60 backdrop-blur-xl p-6 rounded-3xl border border-white/10 mb-8 animate-in slide-in-from-top-4 relative shadow-2xl">
          <button onClick={() => setShowNewCharge(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><XCircle size={20} /></button>
          <h3 className="font-black italic text-lg text-white mb-4 uppercase tracking-wide">Nova Cobrança</h3>
          <form onSubmit={handleCreateCharge} className="space-y-3">
             <div className="flex flex-col gap-1">
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Aluno</label>
               <select 
                 value={newStudentId}
                 onChange={(e) => setNewStudentId(e.target.value)}
                 className="w-full p-3 bg-black/40 border border-white/5 rounded-xl text-white outline-none focus:border-accent-500 font-bold"
               >
                 <option value="">Selecione...</option>
                 {students.map(s => (
                   <option key={s.id} value={s.id}>{s.full_name}</option>
                 ))}
               </select>
             </div>
             
             <div className="flex flex-col gap-1">
               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Descrição</label>
               <input type="text" placeholder="Ex: Mensalidade Maio" required 
                 value={newDesc} onChange={e => setNewDesc(e.target.value)}
                 className="w-full p-3 bg-black/40 border border-white/5 rounded-xl text-white outline-none focus:border-accent-500 font-bold" />
             </div>

             <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Valor (R$)</label>
                <input type="number" placeholder="0,00" required 
                 value={newAmount} onChange={e => setNewAmount(e.target.value)}
                 className="w-full p-3 bg-black/40 border border-white/5 rounded-xl text-white outline-none focus:border-accent-500 font-bold" />
             </div>
             
             <button type="submit" className="w-full bg-accent-500 text-white font-black italic uppercase tracking-wider py-3 rounded-xl mt-2 shadow-lg">Enviar Cobrança</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-zinc-900/40 rounded-2xl animate-pulse border border-white/5"></div>)}
        </div>
      ) : (
        <div className="space-y-3 pb-20">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 pl-1">Histórico</h3>
          {payments.length === 0 && <p className="text-zinc-600 text-center py-4 font-medium italic">Nenhuma cobrança registrada.</p>}
          
          {payments.map(item => (
            <div key={item.id} className="bg-zinc-900/40 backdrop-blur-md p-4 rounded-3xl border border-white/5 flex items-center justify-between hover:bg-zinc-900/60 transition-colors">
              <div className="flex items-center gap-3">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/5 ${item.status === 'paid' ? 'bg-green-500/10 text-green-500' : (item.status === 'overdue' ? 'bg-red-500/10 text-red-500' : 'bg-zinc-800 text-zinc-500')}`}>
                    <User size={18} />
                 </div>
                 <div>
                   <p className="font-bold text-white text-sm">{item.student?.full_name || 'Aluno'}</p>
                   <p className="text-xs text-zinc-400">{item.description}</p>
                   <p className="text-xs font-black italic text-primary-400 mt-0.5">R$ {item.amount.toFixed(2)}</p>
                 </div>
              </div>

              {item.status === 'paid' ? (
                <div className="flex flex-col items-end">
                  <CheckCircle2 size={20} className="text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                  <span className="text-[10px] text-green-500 font-black italic uppercase mt-1">Pago</span>
                </div>
              ) : (
                <span className={`text-[10px] font-black italic uppercase px-2 py-1 rounded-lg ${item.status === 'overdue' ? 'text-red-400 bg-red-900/20 border border-red-500/20' : 'text-zinc-400 bg-zinc-800/50 border border-zinc-700'}`}>
                  {item.status === 'overdue' ? 'Vencido' : (item.status === 'processing' ? 'Aguardando' : 'Pendente')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};