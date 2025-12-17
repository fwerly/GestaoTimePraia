import React, { useEffect, useState } from 'react';
import { Profile } from '../types';
import { getAllProfiles, deleteUserProfile } from '../services/dataService';
import { Trash2, User, Search, ShieldAlert, AlertTriangle } from '../components/ui/Icons';
import { useToast } from '../context/ToastContext';

interface Props {
  user: Profile;
}

export const AdminUsers: React.FC<Props> = ({ user }) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for Modal
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const requestDelete = (e: React.MouseEvent, targetUser: Profile) => {
    e.stopPropagation(); // Impede cliques indesejados no container
    if (targetUser.role === 'admin') {
      addToast("Não é possível remover administradores.", "error");
      return;
    }
    setUserToDelete(targetUser);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      await deleteUserProfile(userToDelete.id);
      addToast("Usuário removido com sucesso!", "success");
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (error: any) {
      console.error(error);
      addToast(error.message || "Erro ao excluir usuário.", "error");
    } finally {
      setIsDeleting(false);
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

      {/* Search Bar */}
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
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{filteredUsers.length} Atletas</span>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-10 opacity-50">
              <User size={48} className="mx-auto mb-2 text-zinc-600" />
              <p className="text-zinc-500 font-medium">Nenhum usuário encontrado.</p>
            </div>
          )}

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
                     {u.role === 'admin' && <ShieldAlert size={12} className="text-yellow-500" />}
                  </div>
                  <p className="text-xs text-zinc-500 truncate font-medium">
                    {u.role === 'admin' ? 'Treinador' : 'Atleta'}
                  </p>
                </div>
              </div>

              {u.id !== user.id && u.role !== 'admin' && (
                <button 
                  onClick={(e) => requestDelete(e, u)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-black/20 text-zinc-600 hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/30 border border-transparent transition-all active:scale-90"
                  title="Excluir Usuário"
                >
                   <Trash2 size={18} />
                </button>
              )}
              
              {u.id === user.id && (
                  <div className="px-3 py-1 bg-primary-500/10 rounded-lg border border-primary-500/20">
                      <span className="text-[10px] text-primary-500 font-bold uppercase">Você</span>
                  </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-zinc-900 w-full max-w-xs rounded-3xl p-6 border border-zinc-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
              
              <div className="flex flex-col items-center text-center mb-6">
                 <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500">
                    <AlertTriangle size={32} />
                 </div>
                 <h3 className="text-xl font-black italic text-white uppercase mb-2">Excluir Atleta?</h3>
                 <p className="text-zinc-400 text-sm">
                   Tem certeza que deseja remover <strong className="text-white">{userToDelete.full_name}</strong>?
                   <br/>
                   <span className="text-xs text-red-400 mt-2 block">Essa ação não pode ser desfeita.</span>
                 </p>
              </div>

              <div className="flex gap-3">
                 <button 
                   onClick={() => setUserToDelete(null)}
                   disabled={isDeleting}
                   className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-colors text-sm uppercase"
                 >
                   Cancelar
                 </button>
                 <button 
                   onClick={confirmDelete}
                   disabled={isDeleting}
                   className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors text-sm uppercase flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                 >
                   {isDeleting ? (
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                   ) : (
                     <>
                       <Trash2 size={16} />
                       Excluir
                     </>
                   )}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};