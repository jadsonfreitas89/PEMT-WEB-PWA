import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

const COMPANIES_COLLECTION = 'empresas';
const USERS_COLLECTION = 'usuarios';
const CODES_COLLECTION = 'codigosPessoais';
const COMPANY_CODES_INDEX = 'codigosEmpresas';
const MAX_ATTEMPTS = 10;
const ALLOWED_PROFILES = ['ADMIN', 'USUARIO', 'TECNICO'];

// --- Helpers ---
const isAdmin = (auth: any) => auth && auth.token && auth.token.admin === true;

function generateCode(prefix: string): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = prefix + '-';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// --- Functions ---

export const validateCompanyCode = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Autenticação necessária.');
  const { codigoEmpresa } = request.data || {};
  if (!codigoEmpresa || typeof codigoEmpresa !== 'string') throw new HttpsError('invalid-argument', 'Código obrigatório.');

  const normalized = codigoEmpresa.trim().toUpperCase();
  try {
    const snapshot = await db.collection(COMPANIES_COLLECTION).where('codigoEmpresa', '==', normalized).get();
    if (snapshot.empty) throw new HttpsError('not-found', 'Código não encontrado.');

    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      empresaId: doc.id,
      empresaNome: data.nome,
      codigoEmpresa: data.codigoEmpresa
    };
  } catch (err: any) {
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', 'Erro interno.');
  }
});

export const adminCreateCompany = onCall(async (request) => {
    if (!isAdmin(request.auth)) throw new HttpsError('permission-denied', 'Acesso negado.');

    const { cnpj, nome, razaoSocial } = request.data;
    if (!cnpj || !nome) throw new HttpsError('invalid-argument', 'CNPJ e nome são obrigatórios.');

    const empresaId = cnpj.replace(/\D/g, '');

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        const codigoEmpresa = generateCode('PEMT');
        const companyRef = db.collection(COMPANIES_COLLECTION).doc(empresaId);
        const indexRef = db.collection(COMPANY_CODES_INDEX).doc(codigoEmpresa);

        try {
            await db.runTransaction(async (t) => {
                const companyDoc = await t.get(companyRef);
                if (companyDoc.exists) throw new Error('COMPANY_EXISTS');

                const indexDoc = await t.get(indexRef);
                if (indexDoc.exists) throw new Error('CODE_COLLISION');

                t.set(indexRef, { empresaId });
                t.set(companyRef, {
                    cnpj: empresaId,
                    nome,
                    razaoSocial: razaoSocial || nome,
                    codigoEmpresa,
                    ativo: true,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });
            return { empresaId, empresaNome: nome, codigoEmpresa };
        } catch (err: any) {
            if (err.message === 'COMPANY_EXISTS') throw new HttpsError('already-exists', 'CNPJ já cadastrado.');
            if (err.message !== 'CODE_COLLISION') throw err;
        }
    }
    throw new HttpsError('resource-exhausted', 'Não foi possível gerar um código único.');
});

export const adminUpdateCompany = onCall(async (request) => {
    if (!isAdmin(request.auth)) throw new HttpsError('permission-denied', 'Acesso negado.');

    const { empresaId, nome, razaoSocial } = request.data || {};
    if (!empresaId || typeof empresaId !== 'string') {
        throw new HttpsError('invalid-argument', 'ID da empresa obrigatório.');
    }
    if (!nome || typeof nome !== 'string' || !nome.trim()) {
        throw new HttpsError('invalid-argument', 'Nome da empresa obrigatório.');
    }

    const companyRef = db.collection(COMPANIES_COLLECTION).doc(empresaId);
    const companyDoc = await companyRef.get();
    if (!companyDoc.exists) {
        throw new HttpsError('not-found', 'Empresa não encontrada.');
    }

    await companyRef.update({
        nome: nome.trim(),
        razaoSocial: razaoSocial ? razaoSocial.trim() : nome.trim(),
        atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, empresaId, empresaNome: nome.trim() };
});

export const adminToggleCompanyStatus = onCall(async (request) => {
    if (!isAdmin(request.auth)) throw new HttpsError('permission-denied', 'Acesso negado.');

    const { empresaId, ativo } = request.data || {};
    if (!empresaId || typeof empresaId !== 'string' || typeof ativo !== 'boolean') {
        throw new HttpsError('invalid-argument', 'Parâmetros inválidos.');
    }

    const companyRef = db.collection(COMPANIES_COLLECTION).doc(empresaId);
    const companyDoc = await companyRef.get();
    if (!companyDoc.exists) {
        throw new HttpsError('not-found', 'Empresa não encontrada.');
    }

    await companyRef.update({
        ativo,
        atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, empresaId, ativo };
});

export const adminCreateUser = onCall(async (request) => {
    if (!isAdmin(request.auth)) throw new HttpsError('permission-denied', 'Acesso negado.');

    const { nome, empresaId, perfil } = request.data;
    if (!nome || !empresaId || !perfil || !ALLOWED_PROFILES.includes(perfil)) {
        throw new HttpsError('invalid-argument', 'Dados inválidos ou perfil não permitido.');
    }

    const companyDoc = await db.collection(COMPANIES_COLLECTION).doc(empresaId).get();
    if (!companyDoc.exists) throw new HttpsError('not-found', 'Empresa não encontrada.');
    const companyName = companyDoc.data()?.nome;

    const userRecord = await admin.auth().createUser({ displayName: nome });

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        const codigoPessoal = generateCode('PESS');
        const userRef = db.collection(USERS_COLLECTION).doc(userRecord.uid);
        const codeRef = db.collection(CODES_COLLECTION).doc(codigoPessoal);

        try {
            await db.runTransaction(async (t) => {
                const codeDoc = await t.get(codeRef);
                if (codeDoc.exists) throw new Error('CODE_COLLISION');

                t.set(userRef, {
                    nome,
                    empresaId,
                    empresaNome: companyName,
                    perfil,
                    codigoPessoal,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
                t.set(codeRef, { uid: userRecord.uid, empresaId });
            });
            return { uid: userRecord.uid, codigoPessoal };
        } catch (err: any) {
            if (err.message !== 'CODE_COLLISION') {
                try { await admin.auth().deleteUser(userRecord.uid); } catch(e) {}
                throw new HttpsError('internal', 'Erro ao finalizar criação do usuário.');
            }
        }
    }
    try { await admin.auth().deleteUser(userRecord.uid); } catch(e) {}
    throw new HttpsError('resource-exhausted', 'Não foi possível gerar um código pessoal único.');
});

export const vinculateUserToCompany = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Autenticação necessária.');
    }

    const { codigoEmpresa, nomeCompleto, registroCrea } = request.data || {};
    if (!codigoEmpresa || typeof codigoEmpresa !== 'string') {
        throw new HttpsError('invalid-argument', 'Código da empresa obrigatório.');
    }
    if (!nomeCompleto || typeof nomeCompleto !== 'string' || !nomeCompleto.trim()) {
        throw new HttpsError('invalid-argument', 'Nome completo obrigatório.');
    }

    const normalizedCode = codigoEmpresa.trim().toUpperCase();
    const regex = /^PEMT-[A-Z0-9]{6}$/;
    if (!regex.test(normalizedCode)) {
        throw new HttpsError('invalid-argument', 'Formato de código inválido.');
    }

    const uid = request.auth.uid;
    const userRef = db.collection(USERS_COLLECTION).doc(uid);
    const indexRef = db.collection(COMPANY_CODES_INDEX).doc(normalizedCode);

    try {
        return await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData?.empresaId && userData.empresaId !== 'EMAIL_PENDING' && userData.empresaId !== 'GOOGLE_PENDING' && userData.empresaId !== '') {
                    throw new Error('ALREADY_LINKED');
                }
            }

            const indexDoc = await t.get(indexRef);
            if (!indexDoc.exists) {
                throw new Error('CODE_NOT_FOUND');
            }

            const { empresaId } = indexDoc.data() || {};
            if (!empresaId) {
                throw new Error('CODE_NOT_FOUND');
            }

            const companyRef = db.collection(COMPANIES_COLLECTION).doc(empresaId);
            const companyDoc = await t.get(companyRef);
            if (!companyDoc.exists) {
                throw new Error('COMPANY_NOT_FOUND');
            }

            const companyData = companyDoc.data();
            if (companyData?.ativo === false) {
                throw new Error('COMPANY_INACTIVE');
            }
            const empresaNome = companyData?.nome || companyData?.name || 'Empresa';

            const existingData = userDoc.exists ? userDoc.data() : {};
            const perfil = existingData?.perfil || 'USUARIO';

            const updateData = {
                ...(existingData || {}),
                uid,
                email: request.auth.token.email || existingData?.email || '',
                nome: nomeCompleto.trim(),
                crea: registroCrea?.trim() || null,
                empresaId,
                empresaNome,
                perfil: perfil === 'ADMIN' || perfil === 'ADMINISTRADOR' ? perfil : 'USUARIO',
                ativo: true,
                primeiroAcesso: false,
                vinculadoEm: admin.firestore.FieldValue.serverTimestamp(),
                atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
            };

            t.set(userRef, updateData, { merge: true });

            const companyUserRef = db.collection(COMPANIES_COLLECTION).doc(empresaId).collection(USERS_COLLECTION).doc(uid);
            t.set(companyUserRef, updateData, { merge: true });

            return {
                success: true,
                empresaId,
                empresaNome
            };
        });
    } catch (err: any) {
        if (err.message === 'ALREADY_LINKED') {
            throw new HttpsError('already-exists', 'Seu perfil já está vinculado a uma empresa.');
        }
        if (err.message === 'COMPANY_INACTIVE') {
            throw new HttpsError('failed-precondition', 'Esta empresa está inativa e não aceita novos vínculos no momento.');
        }
        if (err.message === 'CODE_NOT_FOUND' || err.message === 'COMPANY_NOT_FOUND') {
            throw new HttpsError('not-found', 'Código da Empresa não encontrado. Verifique com seu administrador.');
        }
        if (err instanceof HttpsError) throw err;
        throw new HttpsError('internal', 'Erro interno ao vincular empresa.');
    }
});

export const checkSystemInitialization = onCall(async (request) => {
    try {
        const configDoc = await db.collection('config').doc('sistema').get();
        const instalacaoConcluida = configDoc.exists ? Boolean(configDoc.data()?.instalacaoConcluida) : false;

        const companiesSnapshot = await db.collection(COMPANIES_COLLECTION).limit(1).get();
        const hasCompanies = !companiesSnapshot.empty;

        return {
            instalacaoConcluida: instalacaoConcluida || hasCompanies
        };
    } catch (err) {
        return { instalacaoConcluida: false };
    }
});

export const bootstrapInitialAdmin = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Autenticação necessária.');
    }

    const uid = request.auth.uid;
    const configRef = db.collection('config').doc('sistema');
    const userRef = db.collection(USERS_COLLECTION).doc(uid);

    try {
        await db.runTransaction(async (t) => {
            const configDoc = await t.get(configRef);
            if (configDoc.exists && configDoc.data()?.instalacaoConcluida === true) {
                throw new Error('ALREADY_INITIALIZED');
            }

            const companiesSnapshot = await t.get(db.collection(COMPANIES_COLLECTION).limit(1));
            if (!companiesSnapshot.empty) {
                throw new Error('ALREADY_INITIALIZED');
            }

            t.set(configRef, {
                instalacaoConcluida: true,
                bootstrappedBy: uid,
                bootstrappedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            const userDoc = await t.get(userRef);
            const existingData = userDoc.exists ? userDoc.data() : {};

            const updateData = {
                ...(existingData || {}),
                uid,
                email: request.auth.token.email || existingData?.email || '',
                nome: existingData?.nome || request.auth.token.name || 'Administrador Inicial',
                perfil: 'ADMIN',
                ativo: true,
                primeiroAcesso: false,
                atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
            };

            t.set(userRef, updateData, { merge: true });
        });

        await admin.auth().setCustomUserClaims(uid, { admin: true });

        return {
            success: true,
            message: 'Configuração inicial concluída com sucesso. Privilégios administrativos concedidos.'
        };
    } catch (err: any) {
        if (err.message === 'ALREADY_INITIALIZED') {
            throw new HttpsError('already-exists', 'O sistema já possui uma configuração inicial concluída.');
        }
        if (err instanceof HttpsError) throw err;
        throw new HttpsError('internal', 'Erro interno ao realizar a configuração inicial.');
    }
});
