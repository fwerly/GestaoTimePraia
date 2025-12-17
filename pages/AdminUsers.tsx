import React, { useEffect, useState } from 'react';
import { Profile } from '../types';
import { getAllProfiles, deleteUserProfile, updateUserProfile } from '../services/dataService';
import { Trash2, User, Search, ShieldAlert, AlertTriangle, BadgeCheck, XCircle } from '../components/ui/Icons';
import { useToast } from '../context/ToastContext';

interface Props {
  user: Profile;
}

export const AdminUsers: React.FC<Props> = ({ user }) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await getAllProfiles();
    setUsers(data);
    setLoading(false);
  };

  const handleToggleRole = async (targetUser: Profile) => {
    if (targetUser.id === user.id) {
       addToast("Você não pode alterar seu próprio cargo.", "error");
       return;
    }

    const newRole = targetUser.role === 'admin' ? 'student' : 'admin';
    const confirmMsg = newRole === 'admin' 
      ? `Tornar ${targetUser.full_name} um Administrador?` 
      : `Remover acesso de Administrador de ${targetUser.full_name}?`;

    if (!confirm(confirmMsg)) return;

    setIsActionLoading(true);
    try {
      await updateUserProfile(targetUser.id, { role: newRole });
      addToast(`Cargo atualizado com sucesso!`, "success");
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
    } catch (error) {
      addToast("Erro ao atualizar cargo. Verifique permissões RLS.", "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  const requestDelete = (e: React.MouseEvent, targetUser: Profile) => {
    e.stopPropagation();
    if (targetUser.role === 'admin') {
      addToast("Não é possível remover administradores. Rebaixe-o a atleta primeiro.", "error");
      return;
    }
    setUserToDelete(targetUser);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    setIsActionLoading(true);
    try {
      await deleteUserProfile(userToDelete.id);
      addToast("Usuário removido com sucesso!", "success");
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (error: any) {
      addToast(error.message || "Erro ao excluir usuário.", "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.whatsapp && u.whatsapp.includes(searchTerm))
  );

  return (
    <div>
      <div className="mb-8 px-1">
        <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase drop-shadow-lg">Gestão<br/><span className="text-primary-500">de Equipe</span></h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-3.5 text-zinc-500" size={20} />
        <input 
          type="text" 
          placeholder="Buscar atleta por nome..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900/50 border border-white/5 text-white pl-12 pr-4 py-3.5 rounded-2xl focus:border-primary-500 focus:outline-none transition-all font-bold placeholder:text-zinc-600"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-zinc-900/40 rounded-3xl animate-pulse border border-white/5"></div>)}
        </div>
      ) : (
        <div className="space-y-3 pb-20">
          <div className="flex justify-between items-center px-2 mb-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{filteredUsers.length} Membros</span>
          </div>
          
          {filteredUsers.map(u => (
            <div key={u.id} className="bg-zinc-900/40 backdrop-blur-md p-4 rounded-3xl border border-white/5 flex items-center justify-between group hover:bg-zinc-900/60 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <img 
                  src={u.avatar_url} 
                  alt={u.full_name} 
                  className="w-12 h-12 rounded-full bg-zinc-800 object-cover ring-2 ring-black grayscale group-hover:grayscale-0 transition-all"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                     <p className="font-black text-white truncate text-sm">{u.full_name}</p>
                     {u.role === 'admin' && <BadgeCheck size={14} className="text-primary-500" />}
                  </div>
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                    {u.role === 'admin' ? 'Treinador / Admin' : 'Atleta'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Botão de Toggle Role */}
                {u.id !== user.id && (
                   <button 
                    onClick={() => handleToggleRole(u)}
                    disabled={isActionLoading}
                    className={`p-2.5 rounded-xl border transition-all active:scale-95 ${u.role === 'admin' ? 'bg-zinc-800 text-zinc-500 border-zinc-700' : 'bg-primary-500/10 text-primary-500 border-primary-500/20 hover:bg-primary-500/20'}`}
                    title={u.role === 'admin' ? "Rebaixar para Atleta" : "Tornar Administrador"}
                   >
                     <ShieldAlert size={18} />
                   </button>
                )}

                {/* Botão de Delete */}
                {u.id !== user.id && u.role !== 'admin' && (
                  <button 
                    onClick={(e) => requestDelete(e, u)}
                    disabled={isActionLoading}
                    className="p-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all active:scale-90"
                  >
                     <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-zinc-900 w-full max-w-xs rounded-3xl p-6 border border-zinc-800 shadow-2xl relative">
              <div className="flex flex-col items-center text-center mb-6">
                 <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500">
                    <AlertTriangle size={32} />
                 </div>
                 <h3 className="text-xl font-black italic text-white uppercase mb-2">Excluir?</h3>
                 <p className="text-zinc-400 text-sm">Remover <strong className="text-white">{userToDelete.full_name}</strong> permanentemente?</p>
              </div>
              <div className="flex gap-3">
                 <button onClick={() => setUserToDelete(null)} className="flex-1 bg-zinc-800 text-white font-bold py-3 rounded-xl uppercase text-xs">Não</button>
                 <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl uppercase text-xs">Sim, Excluir</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};