# Firebase Data Model (Análise inicial)

## Estrutura identificada

### Coleções principais
- `usuarios`
  - Documento com UID do usuário
  - Utilizado para autenticação e dados do perfil

- `empresas`
  - Documento com companyId
  - Contém dados da empresa e subcoleções
  - Subcoleções encontradas:
    - `usuarios`
    - `plataformas`

- `checklists`
  - Documento com checklist detalhado
  - Subcoleção `items`
  - Possui imagens possivelmente codificadas em Base64 no documento

- `inspecoes`
  - Documento com inspeção completa
  - Subcoleções `itens` e `fotos`
  - Upload de fotos para Storage e URLs armazenadas em `fotos`

### Uso atual detectado
- `checklists`: usado por `FirebaseSyncRepository` para sincronizar dados antigos e salvar itens de checklist.
- `inspecoes`: usado por `FirebaseSyncRepository` para upload de inspeções novas, fotos e PDF no Storage.

## Diferenças entre `checklists` e `inspecoes`

- `checklists` parece representar o histórico legado de inspeções com fotos Base64 embutidas no documento
- `inspecoes` tem um modelo mais moderno com fotos e itens em subcoleções e URLs de Storage
- `checklists` inclui campos como `photo1`, `photo2`, `photo3`, `photo4`, `signaturePath`, `pdfPath`
- `inspecoes` usa `assinaturaRemoteUrl` e `pdfRemoteUrl` para Storage, além de subcoleções para fotos

## Base64 versus Storage

- `checklists` grava imagens no Firestore como Base64 (ou possivelmente caminhos locais)
- `inspecoes` usa Firebase Storage para media e salva apenas URLs no Firestore

### Riscos
- Base64 em Firestore aumenta tamanho de documento e pode levar a limites de 1 MiB
- Estruturas diferentes podem gerar dados duplicados ou inconsistentes
- Migrar diretamente sem normalizar pode causar sobrescrita ou perda de referência

## Proposta de estrutura futura

- Unificar em uma coleção primária, por exemplo `inspecoes`
- Cada inspeção deve ter:
  - metadados (empresaId, userId, platformId, tipoInspecao, status, justificativa, timestamp)
  - `items` como subcoleção ou array de subdocumentos
  - `photos` como subcoleção ou array de URLs
  - `signatureUrl` e `pdfUrl` armazenados no Storage
  - `companyId` para controle multi-tenant

## Dúvidas a resolver antes da migração

- Qual coleção deve ser considerada fonte primária de verdade: `checklists` ou `inspecoes`?
- O app Android usa `checklists` apenas para histórico legado e `inspecoes` para novos dados?
- Há regras de segurança distintas para cada coleção no Firebase
- Existe um relacionamento direto entre `checklists` e `inspecoes` para o mesmo registro?

## Observações

- Esta fase não altera nenhuma coleção existente.
- A estrutura Web deve ser preparada para trabalhar com estas coleções sem migrar dados imediatamente.
