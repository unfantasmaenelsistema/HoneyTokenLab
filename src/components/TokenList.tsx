import React, { useState } from 'react';
import { Search, Filter, Plus, ShieldCheck } from 'lucide-react';
import { HoneyToken, TokenType } from '../types/token';
import { TokenCard } from './TokenCard';

interface TokenListProps {
  tokens: HoneyToken[];
  onTestTrigger: (tokenId: string) => Promise<void>;
  onDeleteToken: (tokenId: string) => Promise<void>;
  onOpenNewTokenModal: () => void;
  onOpenEmailPreview: (token: HoneyToken) => void;
  onEditEmail: (token: HoneyToken) => void;
  onReactivateToken?: (tokenId: string) => Promise<void>;
  onOpenQrModal?: (token: HoneyToken) => void;
}

export const TokenList: React.FC<TokenListProps> = ({
  tokens,
  onTestTrigger,
  onDeleteToken,
  onOpenNewTokenModal,
  onOpenEmailPreview,
  onEditEmail,
  onReactivateToken,
  onOpenQrModal
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredTokens = tokens.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.filename.toLowerCase().includes(search.toLowerCase()) ||
      t.alertEmail.toLowerCase().includes(search.toLowerCase()) ||
      (t.notes && t.notes.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, archivo, correo o ubicación..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500"
          />
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'docx', label: 'Word' },
            { id: 'xlsx', label: 'Excel' },
            { id: 'pdf', label: 'PDF' },
            { id: 'url', label: 'URLs' },
            { id: 'aws_keys', label: 'AWS' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filterType === f.id
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tokens Grid */}
      {filteredTokens.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTokens.map(token => (
            <TokenCard
              key={token.id}
              token={token}
              onTestTrigger={onTestTrigger}
              onDeleteToken={onDeleteToken}
              onOpenEmailPreview={onOpenEmailPreview}
              onEditEmail={onEditEmail}
              onReactivateToken={onReactivateToken}
              onOpenQrModal={onOpenQrModal}
            />
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">
            No se encontraron Honeytokens
          </h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            {search || filterType !== 'all'
              ? 'No hay trampas que coincidan con los criterios de búsqueda o filtro seleccionados.'
              : 'Todavía no has creado trampas señuelo. Genera tu primer archivo señuelo para comenzar a monitorizar intrusiones.'}
          </p>
          <button
            onClick={onOpenNewTokenModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Primer Honeytoken</span>
          </button>
        </div>
      )}
    </div>
  );
};
