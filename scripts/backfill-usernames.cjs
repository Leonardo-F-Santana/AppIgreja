/**
 * Migração única: cria usernames/{usernameLogin} → { uid, email } para as contas existentes
 * e define 'usernameLogin' nos documentos de 'users' que ainda não o têm.
 *
 * Só considera contas com utilizador real no Firebase Auth (procurado pelo e-mail),
 * para não reservar handles de membros cadastrados pelo admin que ainda não criaram conta.
 *
 * Uso (na raiz do projeto):
 *   npm i --no-save firebase-admin
 *   node scripts/backfill-usernames.cjs           # simulação (não grava nada)
 *   node scripts/backfill-usernames.cjs --apply   # grava as alterações
 */
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const APLICAR = process.argv.includes('--apply');
const serviceAccount = require(path.join(__dirname, '..', 'ministerioide-firebase-adminsdk-fbsvc-7a01b9ef26.json'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const usernameValido = (h) => !!h && !h.includes('/') && h !== '.' && h !== '..' && !/^__.*__$/.test(h);

async function main() {
  console.log(APLICAR ? '>> MODO APLICAR (grava alterações)\n' : '>> MODO SIMULAÇÃO (use --apply para gravar)\n');

  const [usersSnap, usernamesSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('usernames').get(),
  ]);

  const reservados = new Map(usernamesSnap.docs.map((d) => [d.id, d.data().uid]));
  const stats = { criados: 0, jaExistentes: 0, conflitos: 0, semAuth: 0, ignorados: 0 };

  for (const docSnap of usersSnap.docs) {
    const data = docSnap.data();
    const handle = String(data.usernameLogin || data.username || '').trim().toLowerCase();
    const email = String(data.email || '').trim().toLowerCase();

    if (!usernameValido(handle) || !email) { stats.ignorados++; continue; }

    let authUser;
    try {
      authUser = await getAuth().getUserByEmail(email);
    } catch {
      stats.semAuth++;
      continue;
    }

    const donoAtual = reservados.get(handle);
    if (donoAtual && donoAtual !== authUser.uid) {
      console.warn(`CONFLITO: "${handle}" já pertence a ${donoAtual}; ignorado para ${authUser.uid} (${email}).`);
      stats.conflitos++;
      continue;
    }

    if (donoAtual) {
      stats.jaExistentes++;
    } else {
      console.log(`+ usernames/${handle} → ${authUser.uid} (${email})`);
      if (APLICAR) {
        await db.collection('usernames').doc(handle).create({ uid: authUser.uid, email });
      }
      reservados.set(handle, authUser.uid);
      stats.criados++;
    }

    if (!data.usernameLogin && APLICAR) {
      await docSnap.ref.update({ usernameLogin: handle });
    }
  }

  console.log('\nResumo:', stats);
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
