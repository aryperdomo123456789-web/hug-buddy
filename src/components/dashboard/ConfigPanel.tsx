import React, { useEffect, useState } from "react";
import { Copy, Database, Key, Plus, PlugZap, RefreshCw, RotateCcw, Save, Server, Shield, Terminal, Trash2, KeyRound } from "lucide-react";
import { toast } from "sonner";

import type { OdinConfig } from "@/lib/odin";
import {
  getOdinConfigSnapshot,
  saveOdinConfig,
  seedActiveOdinConfig,
  testOdinConnection,
} from "@/lib/server.functions";
import {
  createOdinProvisionToken,
  getOdinProvisionTokens,
  revokeOdinProvisionToken,
} from "@/lib/odin-token.functions";

type OdinFormState = OdinConfig;

type OdinProvisionToken = {
  id: string;
  name: string;
  scope: "all" | "reseller" | "customer";
  tokenHint: string;
  note: string;
  createdAt: string;
  createdBy: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  usageCount: number;
  expiresAt: string | null;
};

const emptyConfig: OdinFormState = {
  sshHost: "",
  sshPort: 22,
  sshUsername: "",
  sshPassword: "",
  dbHost: "",
  dbPort: 7999,
  dbName: "",
  dbUsername: "",
  dbPassword: "",
  apiToken: "",
};

function maskSecret(value: string) {
  if (!value) return "";
  if (value.length <= 6) return "******";
  return `${value.slice(0, 3)}***${value.slice(-3)}`;
}

function formatStableDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export function ConfigPanel() {
  const [activeTab, setActiveTab] = useState<"db" | "api" | "tokens">("db");
  const [form, setForm] = useState<OdinFormState>(emptyConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [tokens, setTokens] = useState<OdinProvisionToken[]>([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [tokenScope, setTokenScope] = useState<"all" | "reseller" | "customer">("all");
  const [tokenNote, setTokenNote] = useState("");
  const [tokenExpiresInDays, setTokenExpiresInDays] = useState("30");
  const [creatingToken, setCreatingToken] = useState(false);
  const [createdToken, setCreatedToken] = useState("");

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:8080";
  const installCmd = `bash <(curl -sSL ${origin}/api/public/install)`;
  const provisionEndpoint = `${origin}/api/public/provision`;
  const exampleProvisionCmd = `curl -X POST ${provisionEndpoint} -H "Authorization: Bearer ${createdToken ? `${createdToken.slice(0, 12)}...` : "SEU_TOKEN"}" -H "Content-Type: application/json" -d '{"action":"create_reseller","payload":{"username":"revenda1","password":"123456","email":"revenda1@exemplo.com"}}'`;

  const loadConfig = async () => {
    setLoading(true);
    try {
      const cfg = await getOdinConfigSnapshot();
      setForm({
        sshHost: cfg.sshHost || "",
        sshPort: cfg.sshPort || 22,
        sshUsername: cfg.sshUsername || "",
        sshPassword: cfg.sshPassword || "",
        dbHost: cfg.dbHost || "",
        dbPort: cfg.dbPort || 7999,
        dbName: cfg.dbName || "",
        dbUsername: cfg.dbUsername || "",
        dbPassword: cfg.dbPassword || "",
        apiToken: cfg.apiToken || "",
      });
    } catch (error: any) {
      toast.error(`Não foi possível carregar o cadastro Odin: ${error?.message || "erro desconhecido"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConfig();
  }, []);

  const loadTokens = async () => {
    setTokensLoading(true);
    try {
      const data = await getOdinProvisionTokens();
      setTokens((data || []) as OdinProvisionToken[]);
    } catch (error: any) {
      toast.error(`Não foi possível carregar tokens: ${error?.message || "erro desconhecido"}`);
    } finally {
      setTokensLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "tokens") {
      void loadTokens();
    }
  }, [activeTab]);

  const updateField = <K extends keyof OdinFormState>(key: K, value: OdinFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await saveOdinConfig(form) as any;
      if (!res?.success) {
        throw new Error(res?.error || "Falha ao salvar cadastro Odin");
      }
      toast.success("Cadastro Odin salvo e ativado neste servidor.");
      await loadConfig();
    } catch (error: any) {
      toast.error(error?.message || "Falha ao salvar cadastro Odin");
    } finally {
      setSaving(false);
    }
  };

  const handleSeedActive = async () => {
    setSaving(true);
    try {
      const res = await seedActiveOdinConfig() as any;
      if (!res?.success) {
        throw new Error(res?.error || "Falha ao aplicar credenciais ativas");
      }
      toast.success("Credenciais ativas do Odin aplicadas com sucesso.");
      await loadConfig();
    } catch (error: any) {
      toast.error(error?.message || "Falha ao aplicar credenciais ativas");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await testOdinConnection() as any;
      if (!res?.success) {
        throw new Error(res?.error || "Conexão com Odin falhou");
      }
      toast.success(`Conexão OK. Usuários encontrados: ${res.data?.usersCount ?? 0}`);
    } catch (error: any) {
      toast.error(error?.message || "Conexão com Odin falhou");
    } finally {
      setTesting(false);
    }
  };

  const handleCreateToken = async () => {
    if (!tokenName.trim()) {
      toast.error("Informe um nome para o token.");
      return;
    }

    setCreatingToken(true);
    try {
      const expiresInDays = Number(tokenExpiresInDays);
      const res = await createOdinProvisionToken({
        data: {
          name: tokenName,
          scope: tokenScope,
          note: tokenNote,
          expiresInDays: Number.isFinite(expiresInDays) && expiresInDays > 0 ? expiresInDays : null,
        }
      } as any) as any;

      if (!res?.success) {
        throw new Error("Falha ao criar token.");
      }

      setCreatedToken(res.token);
      setTokenName("");
      setTokenNote("");
      setTokenScope("all");
      setTokenExpiresInDays("30");
      await loadTokens();
      toast.success("Token de provisionamento criado.");
    } catch (error: any) {
      toast.error(error?.message || "Falha ao criar token");
    } finally {
      setCreatingToken(false);
    }
  };

  const handleRevokeToken = async (id: string) => {
    if (!window.confirm("Revogar este token? Ele deixará de funcionar imediatamente.")) return;

    try {
      const res = await revokeOdinProvisionToken({ data: { id } } as any) as any;
      if (!res?.success) {
        throw new Error("Falha ao revogar token.");
      }
      setTokens((prev) => prev.map((token) => (token.id === id ? { ...token, revokedAt: new Date().toISOString() } : token)));
      toast.success("Token revogado.");
    } catch (error: any) {
      toast.error(error?.message || "Falha ao revogar token");
    }
  };

  const handleCopy = async (value: string, successMessage: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap gap-2 p-1 bg-black/40 border border-zinc-800 rounded-xl w-fit">
        {[
          { id: "db", label: "Banco & SSH", icon: Database },
          { id: "api", label: "Instalador API", icon: Key },
          { id: "tokens", label: "Tokens Odin", icon: KeyRound },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "db" | "api" | "tokens")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
            type="button"
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "db" && (
        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-blue-500 flex items-center gap-2">
                  <Server size={16} /> Cadastro Odin
                </h3>
                <p className="text-xs text-zinc-500 mt-2">
                  Salve os dados ativos do Odin em um arquivo local persistente para o backend usar sem depender de reinício.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSeedActive}
                  disabled={loading || saving}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                  type="button"
                >
                  <RotateCcw size={14} />
                  Carregar credenciais ativas
                </button>
                <button
                  onClick={handleTest}
                  disabled={loading || testing}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                  type="button"
                >
                  <PlugZap size={14} />
                  {testing ? "Testando..." : "Testar conexão"}
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-blue-500 disabled:opacity-50"
                  type="button"
                >
                  <Save size={14} />
                  {saving ? "Salvando..." : "Salvar cadastro"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Host SSH</span>
                <input
                  value={form.sshHost}
                  onChange={(e) => updateField("sshHost", e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Porta SSH</span>
                <input
                  type="number"
                  value={form.sshPort}
                  onChange={(e) => updateField("sshPort", Number(e.target.value) || 22)}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Usuário SSH</span>
                <input
                  value={form.sshUsername}
                  onChange={(e) => updateField("sshUsername", e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Senha SSH</span>
                <input
                  type="password"
                  value={form.sshPassword}
                  onChange={(e) => updateField("sshPassword", e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Host DB</span>
                <input
                  value={form.dbHost}
                  onChange={(e) => updateField("dbHost", e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Porta DB</span>
                <input
                  type="number"
                  value={form.dbPort}
                  onChange={(e) => updateField("dbPort", Number(e.target.value) || 7999)}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Nome do Banco</span>
                <input
                  value={form.dbName}
                  onChange={(e) => updateField("dbName", e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Usuário DB</span>
                <input
                  value={form.dbUsername}
                  onChange={(e) => updateField("dbUsername", e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Senha DB</span>
                <input
                  type="password"
                  value={form.dbPassword}
                  onChange={(e) => updateField("dbPassword", e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Token da API</span>
                <input
                  value={form.apiToken}
                  onChange={(e) => updateField("apiToken", e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100"
                />
              </label>
            </div>

            <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-3">
              <Shield className="text-blue-500 shrink-0 mt-0.5" size={20} />
              <div className="space-y-1 text-xs text-zinc-400">
                <p>
                  Esse cadastro é salvo em arquivo local dedicado ao projeto e usado pelo backend para conectar no Odin.
                </p>
                <p>
                  Backup atual: SSH {form.sshHost}:{form.sshPort}, DB {form.dbHost}:{form.dbPort}/{form.dbName}, token {maskSecret(form.apiToken)}.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "tokens" && (
        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-blue-500 flex items-center gap-2">
                  <KeyRound size={16} /> Tokens de Provisionamento
                </h3>
                <p className="text-xs text-zinc-500 mt-2">
                  Cada token permite criar revendas e clientes via API pública sem expor acesso ao banco.
                </p>
              </div>
              <button
                onClick={() => void loadTokens()}
                disabled={tokensLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
                type="button"
              >
                <RefreshCw size={14} />
                {tokensLoading ? "Atualizando..." : "Atualizar lista"}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <label className="space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Nome do token</span>
                <input
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="Ex: Provisionamento Comercial"
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Escopo</span>
                <select
                  value={tokenScope}
                  onChange={(e) => setTokenScope(e.target.value as "all" | "reseller" | "customer")}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100"
                >
                  <option value="all">Tudo (revenda + cliente)</option>
                  <option value="reseller">Somente revendas</option>
                  <option value="customer">Somente clientes</option>
                </select>
              </label>
              <label className="space-y-2 lg:col-span-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Observação</span>
                <input
                  value={tokenNote}
                  onChange={(e) => setTokenNote(e.target.value)}
                  placeholder="Ex: integração com automação externa"
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Expiração em dias</span>
                <input
                  type="number"
                  min="1"
                  value={tokenExpiresInDays}
                  onChange={(e) => setTokenExpiresInDays(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <div className="flex items-end">
                <button
                  onClick={() => void handleCreateToken()}
                  disabled={creatingToken}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-blue-500 disabled:opacity-50"
                  type="button"
                >
                  <Plus size={14} />
                  {creatingToken ? "Gerando..." : "Gerar token"}
                </button>
              </div>
            </div>
          </div>

          {createdToken && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-emerald-300 uppercase tracking-widest">Token criado agora</p>
                  <p className="text-xs text-zinc-400 mt-2">Copie este valor uma única vez. Depois ele fica salvo apenas como hash local.</p>
                </div>
                <button
                  onClick={() => void handleCopy(createdToken, "Token copiado para a área de transferência")}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-300 hover:bg-emerald-500/20"
                  type="button"
                >
                  <Copy size={14} />
                  Copiar token
                </button>
              </div>
              <div className="mt-4 break-all rounded-xl border border-zinc-800 bg-black p-4 font-mono text-xs text-emerald-300">
                {createdToken}
              </div>
              <div className="mt-4 rounded-xl border border-zinc-800 bg-black/60 p-4 text-xs text-zinc-400 space-y-2">
                <div><span className="text-zinc-500">Endpoint:</span> <span className="text-zinc-200">{provisionEndpoint}</span></div>
                <div>
                  <span className="text-zinc-500">Exemplo:</span>
                  <pre className="mt-2 whitespace-pre-wrap break-all font-mono text-[11px] text-zinc-200">{exampleProvisionCmd}</pre>
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#0f0f12] rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-zinc-200 uppercase tracking-tighter">Tokens salvos</h4>
                <p className="text-[10px] text-zinc-500 uppercase font-black">Somente hashes são persistidos localmente</p>
              </div>
              <span className="text-[10px] text-zinc-500 uppercase font-bold">{tokens.length} token(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-950/50 text-[10px] uppercase font-black text-zinc-500 tracking-widest border-b border-zinc-900">
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">Escopo</th>
                    <th className="px-6 py-4">Uso</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {tokensLoading ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-zinc-500">Carregando tokens...</td>
                    </tr>
                  ) : tokens.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-zinc-500">Nenhum token criado ainda.</td>
                    </tr>
                  ) : tokens.map((token) => (
                    <tr key={token.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-200">{token.name}</div>
                        <div className="text-[10px] text-zinc-500">...{token.tokenHint}</div>
                        {token.note && <div className="text-[10px] text-zinc-600 mt-1">{token.note}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black uppercase px-2 py-1 rounded border bg-blue-500/10 text-blue-500 border-blue-500/20">
                          {token.scope}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {token.usageCount} uso(s)
                        <div className="text-[10px] text-zinc-600">
                          {token.lastUsedAt ? `Último uso: ${formatStableDateTime(token.lastUsedAt)}` : "Ainda não usado"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {token.revokedAt ? (
                          <span className="text-[10px] font-black uppercase px-2 py-1 rounded border bg-red-500/10 text-red-400 border-red-500/20">
                            Revogado
                          </span>
                        ) : token.expiresAt && Date.parse(token.expiresAt) < Date.now() ? (
                          <span className="text-[10px] font-black uppercase px-2 py-1 rounded border bg-amber-500/10 text-amber-400 border-amber-500/20">
                            Expirado
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase px-2 py-1 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            Ativo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!token.revokedAt ? (
                          <button
                            onClick={() => void handleRevokeToken(token.id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-300 hover:bg-red-500/20"
                            type="button"
                          >
                            <Trash2 size={14} />
                            Revogar
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-600 font-bold uppercase">Inativo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "api" && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 animate-in fade-in slide-in-from-bottom-2 duration-500 text-center">
          <Terminal className="mx-auto mb-6 text-blue-500" size={48} />
          <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">Instalador Mago API</h2>
          <p className="text-zinc-400 mb-8 text-sm max-w-md mx-auto">
            Este comando gera o diretório necessário e injeta o <span className="text-blue-500 font-bold">Token de Segurança</span> no seu servidor Odin via terminal.
          </p>

          <div
            className="bg-black p-4 rounded-xl font-mono text-xs text-blue-400 border border-zinc-800 break-all mb-6 select-all cursor-pointer group relative"
            onClick={() => {
              navigator.clipboard.writeText(installCmd);
              toast.success("Comando de instalação copiado!");
            }}
          >
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 px-2 py-1 rounded text-[10px] text-zinc-400">
              CLIQUE PARA COPIAR
            </div>
            {installCmd}
          </div>

          <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center justify-center gap-2">
            <Key size={12} /> Use o endpoint correto: <span className="text-zinc-300">/api/public/install</span>
          </div>
        </div>
      )}
    </div>
  );
}
