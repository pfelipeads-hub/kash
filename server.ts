import express from 'express';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'kash_sec_jwt_9977_token';
const DB_FILE = path.join(process.cwd(), 'database.json');

// Supabase setup and URL sanitization
const SUPABASE_RAW_URL = process.env.SUPABASE_URL || 'https://wzcutncndxzsikmdhetn.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_qROw-t3NfZbHO1KJ7uhY7w_ZwE_S8Ip';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Sanitize URL by removing trailing REST paths for SDK client
const SUPABASE_URL = SUPABASE_RAW_URL.replace(/\/rest\/v1\/?$/, '');

// Prefer Service Role Key for secure server-to-server connection bypassing RLS.
// Fallback gracefully to Anon Key if the Service Role Key is not configured.
const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
const isUsingServiceRole = !!SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, supabaseKey, {
  auth: {
    persistSession: false
  }
});

// Interface definition for DB storage
interface UserDB {
  id: string;
  email: string;
  passwordHash: string;
  username: string;
  transactions: any[];
  goalParams: {
    pct: number;
    months: number;
    startDate: string;
  };
  realizedSavings: Record<number, number>;
}

// Ensure database file exists
function loadUsers(): Record<string, UserDB> {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Falha ao ler database.json, usando memória vazia', err);
  }
  return {};
}

function saveUsers(users: Record<string, UserDB>) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Falha ao persistir database.json', err);
  }
}

// Initialize database with empty if not present
if (!fs.existsSync(DB_FILE)) {
  saveUsers({});
}

// Helper functions to sync a single user to Supabase
async function saveUserToSupabase(user: UserDB): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('kash_users_v1')
      .upsert({
        id: user.id,
        email: user.email,
        username: user.username,
        password_hash: user.passwordHash,
        transactions: user.transactions,
        goal_params: user.goalParams,
        realized_savings: user.realizedSavings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });
    
    if (error) {
      console.warn('Supabase: Erro ao salvar dados no kash_users_v1.', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('Supabase: Exceção de rede ao persistir no banco:', err?.message || err);
    return false;
  }
}

async function getUserFromSupabase(email: string): Promise<UserDB | null> {
  try {
    const { data, error } = await supabase
      .from('kash_users_v1')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      console.warn('Supabase: Erro ao buscar dados do kash_users_v1.', error.message);
      return null;
    }
    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      username: data.username,
      passwordHash: data.password_hash,
      transactions: data.transactions,
      goalParams: data.goal_params,
      realizedSavings: data.realized_savings,
    };
  } catch (err: any) {
    console.warn('Supabase: Exceção ao buscar dados:', err?.message || err);
    return null;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API - Auth - Register Endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, username } = req.body;
      if (!email || !password || !username) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios (email, senha, nome)!' });
      }

      const emailNormalized = email.toLowerCase().trim();
      const users = loadUsers();

      // Check if user already exists in local list OR Supabase
      const existingUserSupabase = await getUserFromSupabase(emailNormalized);
      if (users[emailNormalized] || existingUserSupabase) {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado!' });
      }

      // Hash password
      const passwordHash = bcrypt.hashSync(password, 10);

      // Create profile and base empty states matching original front-end specification
      const newUser: UserDB = {
        id: Math.random().toString(36).substring(2, 11),
        email: emailNormalized,
        passwordHash,
        username: username.trim(),
        transactions: [
          {
            id: 1,
            mes: 'Janeiro',
            descricao: 'Salário Mensal',
            tipo: 'receita',
            rec: 'fixa',
            parcelas: null,
            cat: '-',
            valor: 4500,
          },
          {
            id: 2,
            mes: 'Janeiro',
            descricao: 'Aluguel',
            tipo: 'despesa',
            rec: 'fixa',
            parcelas: null,
            cat: 'moradia',
            valor: 800,
          },
          {
            id: 3,
            mes: 'Janeiro',
            descricao: 'Sofá Novo',
            tipo: 'despesa',
            rec: 'parcela',
            parcelas: 3,
            cat: 'cartao',
            valor: 250,
          }
        ],
        goalParams: {
          pct: 10,
          months: 6,
          startDate: new Date().toISOString().split('T')[0],
        },
        realizedSavings: {},
      };

      // Save locally as a robust backup
      users[emailNormalized] = newUser;
      saveUsers(users);

      // Try saving to Supabase
      const supabaseOk = await saveUserToSupabase(newUser);

      const token = jwt.sign({ email: emailNormalized, id: newUser.id }, JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({
        message: 'Usuário registrado com sucesso!',
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
        },
        supabase: supabaseOk
      });
    } catch (err: any) {
      console.error('Erro no registro de usuário:', err);
      res.status(500).json({ error: 'Ocorreu um erro no servidor durante o registro.' });
    }
  });

  // API - Auth - Login Endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios!' });
      }

      const emailNormalized = email.toLowerCase().trim();
      
      // Load user from Supabase first
      let user = await getUserFromSupabase(emailNormalized);
      let loadedFrom = 'supabase';

      if (!user) {
        // Fall back to local database
        const users = loadUsers();
        user = users[emailNormalized];
        loadedFrom = 'local';
      }

      if (!user) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos!' });
      }

      // Check if password matches (bcrypt or plain text fallback if they manually added a plain text row)
      const isBcrypt = user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$') || user.passwordHash.startsWith('$2y$');
      let passwordValid = false;

      if (isBcrypt) {
        passwordValid = bcrypt.compareSync(password, user.passwordHash);
      } else {
        // Plain text comparison check (for manually added rows in Supabase Table Editor)
        passwordValid = (password === user.passwordHash);
        if (passwordValid) {
          // Upgrade password to robust bcrypt hash in the DB
          user.passwordHash = bcrypt.hashSync(password, 10);
          const users = loadUsers();
          users[emailNormalized] = user;
          saveUsers(users);
          await saveUserToSupabase(user);
        }
      }

      if (!passwordValid) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos!' });
      }

      // If loaded from local backup (and was already hashed/valid), sync back up to Supabase to repair
      if (loadedFrom === 'local') {
        await saveUserToSupabase(user);
      }

      const token = jwt.sign({ email: emailNormalized, id: user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        message: 'Login realizado com sucesso!',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        }
      });
    } catch (err: any) {
      console.error('Erro no login de usuário:', err);
      res.status(500).json({ error: 'Ocorreu um erro no servidor durante o login.' });
    }
  });

  // Authentication Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Autenticação necessária (token ausente).' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, verifiedPayload: any) => {
      if (err) {
        return res.status(403).json({ error: 'Sessão expirada ou token inválido. Faça login de novo.' });
      }
      req.user = verifiedPayload;
      next();
    });
  };

  // API - Supabase Status & Setup diagnostics (useful for setup instructions)
  app.get('/api/supabase/status', async (req, res) => {
    try {
      // Test querying kash_users_v1 with a simple select check
      const { data, error } = await supabase
        .from('kash_users_v1')
        .select('id')
        .limit(1);

      if (error) {
        // Handle postgres schema missing errors elegantly
        if (error.code === 'PGRST116' || error.message.includes('not found') || error.message.includes('does not exist')) {
          return res.json({
            configured: true,
            status: 'setup_required',
            url: SUPABASE_URL,
            isUsingServiceRole,
            error: 'Tabela \'kash_users_v1\' não encontrada no Supabase.'
          });
        }
        return res.json({
          configured: true,
          status: 'error',
          url: SUPABASE_URL,
          isUsingServiceRole,
          error: `Erro ao conectar: ${error.message}`
        });
      }

      return res.json({
        configured: true,
        status: 'connected',
        url: SUPABASE_URL,
        isUsingServiceRole,
        message: 'Supabase conectado com sucesso!'
      });
    } catch (err: any) {
      return res.json({
        configured: false,
        status: 'error',
        isUsingServiceRole,
        error: `Falha ao inicializar o banco de dados: ${err?.message || err}`
      });
    }
  });

  // API - Get User Data
  app.get('/api/user/data', authenticateToken, async (req: any, res) => {
    try {
      const email = req.user.email;
      const users = loadUsers();
      
      // Attempt fetching from Supabase first
      let user = await getUserFromSupabase(email);
      let fromSupabase = true;

      if (!user) {
        // Fall back to local cache
        user = users[email];
        fromSupabase = false;
      } else {
        // Maintain local backup synchronized
        users[email] = user;
        saveUsers(users);
      }

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado!' });
      }

      res.json({
        username: user.username,
        transactions: user.transactions,
        goalParams: user.goalParams,
        realizedSavings: user.realizedSavings,
        fromSupabase,
      });
    } catch (err: any) {
      console.error('Erro ao recuperar dados do usuário:', err);
      res.status(500).json({ error: 'Falha ao buscar os dados do usuário no servidor.' });
    }
  });

  // API - Sync/Save User Data
  app.post('/api/user/data', authenticateToken, async (req: any, res) => {
    try {
      const email = req.user.email;
      const { username, transactions, goalParams, realizedSavings } = req.body;
      const users = loadUsers();
      
      let user = users[email];
      if (!user) {
        user = await getUserFromSupabase(email) || {
          id: req.user.id || Math.random().toString(36).substring(2, 11),
          email,
          passwordHash: '',
          username: username || '',
          transactions: [],
          goalParams: { pct: 10, months: 6, startDate: '' },
          realizedSavings: {},
        };
      }

      // Update values
      if (username !== undefined) user.username = username;
      if (transactions !== undefined) user.transactions = transactions;
      if (goalParams !== undefined) user.goalParams = goalParams;
      if (realizedSavings !== undefined) user.realizedSavings = realizedSavings;

      // Update local storage backup
      users[email] = user;
      saveUsers(users);

      // Perform background/parallel sync to Supabase
      const supabaseOk = await saveUserToSupabase(user);

      res.json({ 
        message: 'Dados sincronizados com sucesso!',
        supabase: supabaseOk
      });
    } catch (err: any) {
      console.error('Erro ao sincronizar dados:', err);
      res.status(500).json({ error: 'Falha ao salvar modificações no servidor.' });
    }
  });

  // Vite Integration Middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
