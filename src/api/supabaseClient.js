import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Cliente Supabase
// ---------------------------------------------------------------------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Ajuda a diagnosticar deploys sem variáveis de ambiente configuradas.
  console.error(
    '[StageGear] Variáveis VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY não definidas. ' +
    'Crie um arquivo .env.local (dev) ou configure-as no build (Hostinger).'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ---------------------------------------------------------------------------
// Mapeamento Entidade (código) -> Tabela (Postgres)
// ---------------------------------------------------------------------------
const TABLE_MAP = {
  Client: 'clients',
  Equipment: 'equipment',
  Rental: 'rentals',
  Quote: 'quotes',
  Invoice: 'invoices',
  Expense: 'expenses',
  AccountPayable: 'accounts_payable',
};

// Normaliza a linha vinda do banco para o formato que o app espera.
// O Base44 expunha created_date / updated_date; aqui usamos created_at / updated_at.
const normalizeRow = (row) => {
  if (!row || typeof row !== 'object') return row;
  return {
    ...row,
    created_date: row.created_at ?? row.created_date ?? null,
    updated_date: row.updated_at ?? row.updated_date ?? null,
  };
};

// Remove campos calculados/somente-leitura antes de gravar.
const stripReadOnly = (data) => {
  const clone = { ...data };
  delete clone.id;
  delete clone.created_date;
  delete clone.updated_date;
  delete clone.created_at;
  delete clone.updated_at;
  delete clone.created_by;
  return clone;
};

// Converte "-created_date" -> { column: 'created_at', ascending: false }
const parseOrder = (order) => {
  if (!order || typeof order !== 'string') {
    return { column: 'created_at', ascending: false };
  }
  const ascending = !order.startsWith('-');
  let column = ascending ? order : order.slice(1);
  if (column === 'created_date') column = 'created_at';
  if (column === 'updated_date') column = 'updated_at';
  return { column, ascending };
};

function makeEntity(entityName) {
  const table = TABLE_MAP[entityName];

  return {
    async list(order, limit) {
      const { column, ascending } = parseOrder(order);
      let q = supabase.from(table).select('*').order(column, { ascending });
      if (typeof limit === 'number') q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(normalizeRow);
    },

    // Suporte a filtros simples: filter({ campo: valor }, order)
    async filter(criteria = {}, order) {
      const { column, ascending } = parseOrder(order);
      let q = supabase.from(table).select('*');
      for (const [key, value] of Object.entries(criteria)) {
        q = q.eq(key, value);
      }
      q = q.order(column, { ascending });
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(normalizeRow);
    },

    async get(id) {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
      if (error) throw error;
      return normalizeRow(data);
    },

    async create(payload) {
      const { data, error } = await supabase
        .from(table)
        .insert(stripReadOnly(payload))
        .select()
        .single();
      if (error) throw error;
      return normalizeRow(data);
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from(table)
        .update(stripReadOnly(payload))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return normalizeRow(data);
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  };
}

// ---------------------------------------------------------------------------
// Entidade especial: User -> tabela "profiles"
// ---------------------------------------------------------------------------
const UserEntity = {
  async list() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(normalizeRow);
  },
  async update(id, payload) {
    const { data, error } = await supabase
      .from('profiles')
      .update(stripReadOnly(payload))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return normalizeRow(data);
  },
};

// ---------------------------------------------------------------------------
// Auth (compatível com a antiga API base44.auth.*)
// ---------------------------------------------------------------------------
async function getMergedUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    const err = new Error('Not authenticated');
    err.status = 401;
    throw err;
  }
  let profile = null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  profile = data || {};
  return {
    id: user.id,
    email: user.email,
    full_name: profile.full_name || user.user_metadata?.full_name || '',
    phone: profile.phone || '',
    company: profile.company || '',
    role: profile.role || 'user',
    archived: profile.archived || false,
  };
}

const auth = {
  me: getMergedUser,

  async updateMe(payload) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const clean = stripReadOnly(payload);
    delete clean.email; // e-mail não é editável por aqui
    delete clean.role;  // papel só é alterado por admin via tela de usuários
    const { data, error } = await supabase
      .from('profiles')
      .update(clean)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    return normalizeRow(data);
  },

  async logout() {
    await supabase.auth.signOut();
    // Redireciona para a página de login da própria aplicação.
    window.location.href = '/login';
  },

  redirectToLogin() {
    window.location.href = '/login';
  },
};

// ---------------------------------------------------------------------------
// Convite de usuários (via Edge Function segura)
// ---------------------------------------------------------------------------
const users = {
  async inviteUser(email, role = 'user', fullName = '') {
    const { data, error } = await supabase.functions.invoke('invite-user', {
      body: { email, role, full_name: fullName },
    });
    if (error) throw error;
    return data;
  },

  // Exclui o usuário de forma permanente via função no banco (RPC).
  // Mais confiável que a API admin do GoTrue (que falha nesse projeto).
  async deleteUser(userId) {
    const { error } = await supabase.rpc('delete_user', { uid: userId });
    if (error) throw error;
    return { success: true };
  },

  // Arquiva/desarquiva: mantém o registro, apenas marca o perfil.
  // O acesso ao app é bloqueado no AuthContext (usuário arquivado é deslogado).
  // Feito direto na tabela (RLS de admin) por ser mais confiável que a API de ban.
  async setArchived(userId, archived) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        archived,
        archived_at: archived ? new Date().toISOString() : null,
      })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ---------------------------------------------------------------------------
// Integrações: upload de arquivos -> Supabase Storage (bucket "uploads")
// ---------------------------------------------------------------------------
const integrations = {
  Core: {
    async UploadFile({ file }) {
      const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from('uploads')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('uploads').getPublicUrl(path);
      return { file_url: data.publicUrl };
    },
  },
};

// ---------------------------------------------------------------------------
// Objeto compatível com a antiga API do Base44
// ---------------------------------------------------------------------------
const entities = {
  User: UserEntity,
  ...Object.fromEntries(Object.keys(TABLE_MAP).map((name) => [name, makeEntity(name)])),
};

export const base44 = { entities, auth, users, integrations };
