require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
if (!FIREBASE_API_KEY) {
  console.error('Falta FIREBASE_API_KEY no arquivo .env');
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ projeto: 'Aplicativo de Rotina Escolar', mensagem: 'Servidor funcionando!' }));

app.post('/cadastro', async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha || senha.length < 6) {
    return res.status(400).json({ erro: 'Verifique os dados e tente novamente.' });
  }
  try {
    const usuario = await getAuth().createUser({ email, password: senha, displayName: nome });
    await db.collection('usuarios').doc(usuario.uid).set({ nome, email, criadoEm: new Date().toISOString() });
    res.json({ uid: usuario.uid, nome, email });
  } catch (erro) {
    console.error('Erro no cadastro:', erro.code || erro.message);
    const msg = erro.code === 'auth/email-already-exists' ? 'Esse e-mail já está cadastrado.' : 'Verifique os dados e tente novamente.';
    res.status(400).json({ erro: msg });
  }
});

app.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  try {
    const resposta = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: senha, returnSecureToken: true }),
    });
    const dados = await resposta.json();
    if (dados.error) throw new Error(dados.error.message);
    const doc = await db.collection('usuarios').doc(dados.localId).get();
    res.json({ uid: dados.localId, email, nome: doc.data()?.nome });
  } catch (erro) {
    console.error('Erro no login:', erro.message);
    res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }
});

// Agenda separada por usuário: usuarios/{uid}/agenda
app.get('/agenda/:uid', async (req, res) => {
  try {
    const snapshot = await db.collection('usuarios').doc(req.params.uid).collection('agenda').get();
    res.json(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (erro) {
    console.error('Erro ao listar agenda:', erro.message);
    res.status(500).json({ erro: 'Não foi possível carregar a agenda.' });
  }
});

app.post('/agenda/:uid', async (req, res) => {
  const { id, titulo, data, tipo } = req.body;
  if (!id || !titulo || !data) return res.status(400).json({ erro: 'Dados incompletos.' });
  try {
    await db.collection('usuarios').doc(req.params.uid).collection('agenda').doc(String(id)).set({ titulo, data, tipo: tipo || 'Tarefa' });
    res.json({ id });
  } catch (erro) {
    console.error('Erro ao salvar agenda:', erro.message);
    res.status(500).json({ erro: 'Não foi possível salvar.' });
  }
});

app.delete('/agenda/:uid/:id', async (req, res) => {
  try {
    await db.collection('usuarios').doc(req.params.uid).collection('agenda').doc(req.params.id).delete();
    res.json({ id: req.params.id });
  } catch (erro) {
    console.error('Erro ao apagar agenda:', erro.message);
    res.status(500).json({ erro: 'Não foi possível apagar.' });
  }
});

app
  .listen(3000, '0.0.0.0', () => console.log('[servidor] Rodando na porta 3000'))
  .on('error', (e) => console.log(e.code === 'EADDRINUSE' ? '[servidor] Porta 3000 já está em uso (servidor já rodando).' : `[servidor] Erro: ${e.message}`));