# Modelo de Autenticação Android

## 1. Como o usuário é autenticado
O app Android utiliza Firebase Authentication.

- Login por e-mail e senha: `FirebaseAuth.signInWithEmailAndPassword(email, password)`.
- Registro por e-mail e senha: `FirebaseAuth.createUserWithEmailAndPassword(email, password)`.
- Login com Google: `FirebaseAuth.signInWithCredential(GoogleAuthProvider.getCredential(idToken, null))`.

O código principal está em:
- `app/src/main/java/br/com/jadson/appchecklistpemt/data/repository/AuthRepository.kt`
- `app/src/main/java/br/com/jadson/appchecklistpemt/services/AuthenticationService.kt`
- `app/src/main/java/br/com/jadson/appchecklistpemt/viewmodel/AuthViewModel.kt`

## 2. Como o usuário é identificado
O usuário é identificado pelo UID do Firebase Authentication.

- `AuthRepository.getUserId()` retorna `firebaseAuth.currentUser?.uid`.
- `AuthenticationService.currentUser` expõe o estado do usuário Firebase.
- `Usuario.uid` é o identificador primário do usuário no Firestore e no banco local.

## 3. Onde o perfil é armazenado
Os dados do perfil do usuário são armazenados em Firestore e também localmente via Room.

No Firestore, o perfil é salvo em duas localizações:

- `usuarios/{uid}`
- `empresas/{empresaId}/usuarios/{uid}`

A escrita é feita por `FirestoreService.saveUsuario(usuario)`, chamada por `UserRepository.saveUsuario(usuario)`.

## 4. Como `empresaId` é obtido
O `empresaId` vem do documento `Usuario`.

Estrutura de usuário relevante:
- `usuario.empresaId`
- `usuario.empresaNome`

O fluxo típico é:
- login/registro → `usuarios/{uid}` → ler `empresaId`
- se `empresaId` estiver definido e não for um marcador de pendência, o usuário é considerado vinculado à empresa

## 5. Como o perfil completo é determinado
O Android considera o perfil completo quando:

- `remoteUser.nome.isNotBlank()`
- `remoteUser.empresaId` não é `GOOGLE_PENDING`
- `remoteUser.empresaId` não é `EMAIL_PENDING`

Ou seja, o perfil é tratado como incompleto quando:

- não há documento `usuarios/{uid}`
- `nome` está em branco
- `empresaId` é `GOOGLE_PENDING` ou `EMAIL_PENDING`

## 6. Como o Android trata login Google
O login Google é tratado assim:

1. O usuário escolhe a conta Google via `GoogleSignInClient`.
2. O app obtém um `idToken` e cria um `GoogleAuthProvider` credential.
3. O app chama `firebaseAuth.signInWithCredential(credential)`.
4. Após login, o app tenta ler o perfil do usuário:
   - primeiro em `usuarios/{uid}`;
   - se não existir, em `collectionGroup('usuarios').whereEqualTo('uid', uid)`.
5. Se existir e `empresaId != GOOGLE_PENDING`, o login é considerado completo.
6. Se não existir ou estiver pendente, o app cria um documento `Usuario` inicial com:
   - `tipoLogin = "GOOGLE"`
   - `perfil = INSPETOR`
   - `empresaId = "GOOGLE_PENDING"`
   - `empresaNome = "Pendente de Vínculo"`
7. O app redireciona para `CompleteProfile`.

## 7. Como o Android trata login por e-mail/senha
O login por e-mail/senha segue este fluxo:

1. `firebaseAuth.signInWithEmailAndPassword(email, password)`.
2. Busca em `usuarios/{uid}`.
3. Se não encontrado, tenta fallback em `collectionGroup('usuarios')` por `uid`.
4. Se encontrar o usuário:
   - salva localmente via `UserRepository.saveUsuario(remoteUser)`;
   - se o perfil estiver completo, emite `loginSuccess`;
   - caso contrário, emite `needsProfileCompletion`.
5. Se não encontrar o usuário, também emite `needsProfileCompletion`.

## 8. Diferenças ou inconsistências encontradas
- O Android armazena o perfil do usuário em duas localizações Firestore: raiz `usuarios/{uid}` e documentação multi-tenant `empresas/{empresaId}/usuarios/{uid}`.
- O fallback `collectionGroup('usuarios')` pode depender de índices e está presente apenas por compatibilidade com usuários antigos.
- `AuthRepository.getCompanyId()` retorna sempre `default_company`, o que não reflete o `empresaId` real do usuário.
- O fluxo de registro de e-mail cria automaticamente um `Usuario` com `empresaId = "EMAIL_PENDING"`, enquanto o login Google cria `empresaId = "GOOGLE_PENDING"`.
- A conclusão de perfil no Android exige `nome` e vínculo com empresa, mas o app Android também preenche empresa nova pelo `CompleteProfileFragment`.
- O Web atual já tem rotas de login e registro, mas não está conectado ao Firebase Auth completo.

## 9. Relação usuário → empresaId → empresa
No modelo Android, a relação é:

- Usuário autenticado (Firebase UID)
  - documento em `usuarios/{uid}` com campo `empresaId`
  - campo `empresaId` aponta para `empresas/{empresaId}`
  - também existe cópia do usuário em `empresas/{empresaId}/usuarios/{uid}`

Portanto:

`USUÁRIO (uid) → usuarios/{uid} → empresaId → empresas/{empresaId}`

e

`USUÁRIO (uid) → empresas/{empresaId}/usuarios/{uid}`

Esse duplo armazenamento sugere:
- raiz `usuarios` usado para autenticação/busca rápida;
- árvore `empresas/.../usuarios` usada para dados multi-tenant e consultas por empresa.

## 10. Mapeamento Android → Web
No Web, o usuário exposto em `AuthContext` usará os seguintes campos:

- `empresaId` (Android) → `companyId` (Web)
- `empresaNome` (Android) → `companyName` (Web)

Esse mapeamento garante que o Web use o mesmo modelo de identificação existente no Android, sem criar um modelo paralelo de usuário.
