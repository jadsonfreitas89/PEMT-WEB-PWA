# PEMT Web

Este diretório contém a base inicial para a aplicação Web / PWA do sistema PEMT.

## Estrutura
- `src/`: código fonte TypeScript e React
- `public/`: assets públicos
- `docs/FIREBASE_DATA_MODEL.md`: análise da estrutura atual do Firebase e diferenças entre `checklists` e `inspecoes`

## Instalação
1. Copie `.env.example` para `.env`
2. Preencha as variáveis do Firebase
3. Execute `npm install`

## Scripts
- `npm run dev`: executa o servidor de desenvolvimento
- `npm run build`: compila a aplicação para produção
- `npm run preview`: pré-visualiza o build

> Nota: em Node 18, a build requer suporte a `globalThis.crypto`. Execute o script de build via `npm run build` como está ou, se necessário, configure `NODE_OPTIONS=--experimental-global-webcrypto`.

## Firebase
A aplicação está configurada para ler as variáveis de ambiente:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Observações da Fase 2
- Apenas a estrutura e layout inicial foram criados.
- Não há conexão ativa com Firebase de produção nesta fase.
- A autenticação está preparada e suporta inicialização segura quando houver configuração.

## Próximos passos
- Fase 3: autenticação completa com Firebase
- Fase 4: implementação do checklist
- Fase 5: fotografias e armazenamento
