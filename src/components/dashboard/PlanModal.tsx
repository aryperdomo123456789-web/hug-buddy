import React, { useState } from "react";
import { Plan, Bouquet } from "@/types/odin";
import { X, Save, Settings2, Monitor, ShieldCheck, PlayCircle, Database, Check } from "lucide-react";

interface PlanModalProps {
  plan: Plan | null;
  onClose: () => void;
  onSave: (data: Plan) => Promise<void>;
  loading?: boolean;
  odinPackages?: any[]; // Passed from parent if needed to link
  bouquets?: Bouquet[]; // List of available bouquets from Odin
}

export function PlanModal({ plan, onClose, onSave, loading, odinPackages = [], bouquets = [] }: PlanModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'advanced' | 'restrictions' | 'bouquets' | 'template'>('details');
  const [bouquetSearch, setBouquetSearch] = useState("");
  
  const [data, setData] = useState<Plan>(plan || { 
    name: "", 
    connections: 1, 
    duration: 1, 
    duration_unit: 'months', 
    price: 0, 
    status: 'active', 
    bouquets: [], 
    sort_order: 0, 
    is_trial: false, 
    has_adult_content: false,
    odin_server_id: null,
    odin_package_id: null,
    template: null,
    plan_price: null,
    pay_url: null,
    dns_host: null,
    can_gen_mag: true,
    can_gen_enigma: true,
    only_mag: false,
    only_enigma: false,
    lock_stb: false,
    is_restream: false,
    output_formats: ["m3u8", "ts"]
  } as Plan);

  const toggleOutputFormat = (format: string) => {
    const current = data.output_formats || [];
    if (current.includes(format)) {
      setData({ ...data, output_formats: current.filter(f => f !== format) });
    } else {
      setData({ ...data, output_formats: [...current, format] });
    }
  };

  const toggleBouquet = (id: number) => {
    const current = data.bouquets || [];
    if (current.includes(id)) {
      setData({ ...data, bouquets: current.filter(bId => bId !== id) });
    } else {
      setData({ ...data, bouquets: [...current, id] });
    }
  };

  const filteredBouquets = bouquets.filter(b => 
    b.name.toLowerCase().includes(bouquetSearch.toLowerCase()) ||
    String(b.id).includes(bouquetSearch)
  );

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#0f0f12] w-full max-w-3xl rounded-3xl border border-zinc-800 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/50 rounded-t-3xl">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
              <Settings2 className="text-blue-500" size={24} />
              {plan ? "Editar Pacote" : "Novo Pacote"}
            </h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Configurações de Plano Odin v6</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-2 bg-zinc-900 rounded-xl border border-zinc-800">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-zinc-900 bg-zinc-950/20 overflow-x-auto no-scrollbar">
          {[
            { id: 'details', label: 'Detalhes', icon: Settings2 },
            { id: 'advanced', label: 'Avançado', icon: Monitor },
            { id: 'restrictions', label: 'Restrições', icon: ShieldCheck },
            { id: 'bouquets', label: 'Bouquets', icon: Database },
            { id: 'template', label: 'Template', icon: PlayCircle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id 
                  ? "border-blue-500 text-blue-500 bg-blue-500/5" 
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'details' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nome do Pacote</label>
                  <input 
                    placeholder="Ex: Plano Trimestral VIP" 
                    value={data.name} 
                    onChange={e => setData({...data, name: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Preço Sugerido (R$)</label>
                  <input 
                    type="number"
                    placeholder="0.00" 
                    value={data.price} 
                    onChange={e => setData({...data, price: Number(e.target.value)})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Conexões Max.</label>
                  <input 
                    type="number"
                    value={data.connections} 
                    onChange={e => setData({...data, connections: Number(e.target.value)})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Duração</label>
                  <input 
                    type="number"
                    value={data.duration} 
                    onChange={e => setData({...data, duration: Number(e.target.value)})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Unidade</label>
                  <select 
                    value={data.duration_unit}
                    onChange={e => setData({...data, duration_unit: e.target.value as any})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                  >
                    <option value="minutes">Minutos</option>
                    <option value="hours">Horas</option>
                    <option value="days">Dias</option>
                    <option value="months">Meses</option>
                    <option value="years">Anos</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                <input 
                  type="checkbox" 
                  id="is_trial"
                  checked={data.is_trial} 
                  onChange={e => setData({...data, is_trial: e.target.checked})}
                  className="w-5 h-5 rounded border-zinc-800 bg-zinc-950 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_trial" className="text-xs font-bold text-zinc-300 uppercase tracking-wider cursor-pointer">
                  Este é um plano de TESTE (Trial)
                </label>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-950/50 p-6 rounded-2xl border border-zinc-800 space-y-4">
                  <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Monitor size={14} /> Dispositivos Permitidos
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" checked={data.can_gen_mag} onChange={e => setData({...data, can_gen_mag: e.target.checked})} className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-blue-600" />
                      <span className="text-xs text-zinc-400 group-hover:text-zinc-200">Gerar MAG</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" checked={data.can_gen_enigma} onChange={e => setData({...data, can_gen_enigma: e.target.checked})} className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-blue-600" />
                      <span className="text-xs text-zinc-400 group-hover:text-zinc-200">Gerar Enigma</span>
                    </label>
                    <div className="pt-2 border-t border-zinc-900 mt-2">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={data.only_mag} onChange={e => setData({...data, only_mag: e.target.checked})} className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-amber-600" />
                        <span className="text-xs text-zinc-400 group-hover:text-zinc-200">Apenas MAG</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950/50 p-6 rounded-2xl border border-zinc-800 space-y-4">
                  <h3 className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <PlayCircle size={14} /> Formatos de Saída
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {['m3u8', 'ts', 'rtmp', 'mp4', 'mkv'].map(format => (
                      <label key={format} className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={data.output_formats?.includes(format)} 
                          onChange={() => toggleOutputFormat(format)}
                          className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-purple-600" 
                        />
                        <span className="text-xs text-zinc-400 group-hover:text-zinc-200 uppercase">{format}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'restrictions' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-zinc-950/50 p-6 rounded-2xl border border-zinc-800 space-y-6">
                <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Travar STB / MAC</p>
                    <p className="text-[9px] text-zinc-500 uppercase">Impedir uso em outros dispositivos após o primeiro login</p>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={data.lock_stb} onChange={e => setData({...data, lock_stb: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Permitir Restream</p>
                    <p className="text-[9px] text-zinc-500 uppercase">Permite que o usuário use o link para retransmissão</p>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={data.is_restream} onChange={e => setData({...data, is_restream: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Conteúdo Adulto</p>
                    <p className="text-[9px] text-zinc-500 uppercase">Habilita acesso a grupos e bouquets marcados como adultos</p>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={data.has_adult_content} onChange={e => setData({...data, has_adult_content: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bouquets' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Seleção de Conteúdo</h3>
                  <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mt-0.5">Defina quais bouquets este plano terá acesso</p>
                </div>
                <div className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                  {data.bouquets?.length || 0} SELECIONADOS
                </div>
              </div>

              <div className="relative">
                <input 
                  type="text"
                  placeholder="Pesquisar Bouquet por nome ou ID..."
                  value={bouquetSearch}
                  onChange={e => setBouquetSearch(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 focus:border-blue-500 outline-none mb-4"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto pr-2 custom-scrollbar max-h-[400px]">
                {filteredBouquets.map(bouquet => {
                  const isSelected = data.bouquets?.includes(bouquet.id);
                  return (
                    <button
                      key={bouquet.id}
                      onClick={() => toggleBouquet(bouquet.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                        isSelected 
                          ? "bg-blue-600/10 border-blue-500/50 text-blue-400" 
                          : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase truncate max-w-[180px]">{bouquet.name}</span>
                        <span className="text-[8px] font-mono opacity-50">ID: {bouquet.id}</span>
                      </div>
                      {isSelected && <Check size={14} className="shrink-0" />}
                    </button>
                  );
                })}
                {filteredBouquets.length === 0 && (
                  <div className="col-span-full py-10 text-center text-zinc-600 uppercase text-[10px] font-black tracking-widest border-2 border-dashed border-zinc-900 rounded-2xl">
                    Nenhum bouquet encontrado
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'template' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">URL de Pagamento (pay_url)</label>
                  <input 
                    placeholder="Ex: https://checkout.com/plano-vip" 
                    value={data.pay_url || ""} 
                    onChange={e => setData({...data, pay_url: e.target.value || null})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Host de Link Curto (dns_host)</label>
                  <input 
                    placeholder="Ex: d.meuapp.tv" 
                    value={data.dns_host || ""} 
                    onChange={e => setData({...data, dns_host: e.target.value || null})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="bg-blue-600/5 border border-blue-600/20 p-4 rounded-2xl space-y-2">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Variáveis Dinâmicas</p>
                <div className="flex flex-wrap gap-2">
                  {['{username}', '{password}', '{dns}', '{dns_host}', '{expires_at}', '{connections}', '{plan_price}', '{pay_url}', '{package}'].map(v => (
                    <span key={v} className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 text-[9px] font-mono rounded-md">{v}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Modelo de Mensagem Personalizado</label>
                  <button 
                    onClick={() => setData({
                      ...data, 
                      template: `✅ *Usuário:* {username}\n✅ *Senha:* {password}\n📦 *Plano:* {package}\n💳 *Assinar/Renovar:* {pay_url}\n💵 *Valor:* {plan_price}\n🗓️ *Vencimento:* {expires_at}\n📶 *Conexões:* {connections}\n\n🟠 *DNS XCIPTV:* {dns}\n🟢 *Link (M3U):* {dns}/get.php?username={username}&password={password}&type=m3u_plus&output=mpegts\n🟢 *Link Curto:* http://e.{dns_host}/p/{username}/{password}/m3u\n\n📺 *WebPlayer:* http://assistir.online/`
                    })}
                    className="text-[9px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest"
                  >
                    Carregar Exemplo
                  </button>
                </div>
                <textarea 
                  placeholder="Ex: Olá {username}, sua assinatura expira em {expires_at}..."
                  value={data.template || ""}
                  onChange={e => setData({...data, template: e.target.value || null})}
                  className="w-full h-64 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-xs font-mono text-zinc-300 focus:border-blue-500 outline-none transition-all leading-relaxed"
                />
              </div>
              
              <p className="text-[9px] text-zinc-600 italic ml-2 uppercase font-bold tracking-widest">
                Deixe em branco para usar o template padrão das configurações globais.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-900 flex justify-end gap-4 bg-zinc-950/50 rounded-b-3xl">
          <button 
            onClick={onClose} 
            className="px-6 py-3 text-zinc-500 hover:text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            Descartar
          </button>
          <button 
            onClick={() => {
              const { id, ...cleanData } = data;
              onSave(data);
            }} 
            disabled={loading} 

            className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-blue-600/20"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin rounded-full" /> : <Save size={16} />} 
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}
