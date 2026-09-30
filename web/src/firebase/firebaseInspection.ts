import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { firestoreInstance } from './firebaseApp';
import type {
  Inspection,
  InspectionItem,
  InspectionPhoto,
  InspectionCategory
} from '../types/inspection';
import type { Platform } from '../types/platform';

const INSPECTIONS_COLLECTION = 'inspecoes';
const CHECKLISTS_COLLECTION = 'checklists';
const PLATFORMS_COLLECTION = 'plataformas';
const LOCAL_STORAGE_CACHE_KEY = 'pemt_inspections_cache';
const LOCAL_STORAGE_PLATFORMS_KEY = 'pemt_platforms_cache';

/**
 * Salva a inspeção no Firestore seguindo atomicamente o modelo multi-tenant:
 * 1. Documento em 'inspecoes/{id}'
 * 2. Subcoleção 'inspecoes/{id}/itens/{itemId}'
 * 3. Subcoleção 'inspecoes/{id}/fotos/{fotoId}'
 * 4. Espelhamento de compatibilidade em 'checklists/{id}' e 'checklists/{id}/items/{itemId}'
 * 5. Cache local offline-first
 */
export async function saveInspectionToFirestore(params: {
  inspection: Inspection;
  categories: InspectionCategory[];
  photos: InspectionPhoto[];
  signatureBase64?: string;
}): Promise<Inspection> {
  const { inspection, categories, photos, signatureBase64 } = params;
  const now = Date.now();

  if (inspection.empresaId && firestoreInstance) {
    try {
      const companyRef = doc(firestoreInstance, 'empresas', inspection.empresaId);
      const companySnap = await getDoc(companyRef);
      if (companySnap.exists()) {
        const companyData = companySnap.data();
        if (companyData.ativo === false) {
          throw new Error('Empresa inativa. Não é permitido criar novas inspeções para empresas inativas.');
        }
      }
    } catch (err: any) {
      if (err.message?.includes('inativa')) throw err;
    }
  }

  const inspectionId = inspection.id || crypto.randomUUID();

  // Calcular contagens para rápida exibição
  let totalItens = 0;
  let conformes = 0;
  let naoConformes = 0;
  let na = 0;

  const flattenedItems: InspectionItem[] = [];

  categories.forEach((cat) => {
    cat.itens.forEach((item) => {
      totalItens++;
      if (item.status === 'CONFORME') conformes++;
      else if (item.status === 'NAO_CONFORME') naoConformes++;
      else if (item.status === 'NA') na++;

      flattenedItems.push({
        id: item.id || crypto.randomUUID(),
        inspecaoId: inspectionId,
        categoria: cat.nome,
        descricao: item.nome,
        status: item.status,
        observacao: item.observacao || null,
        fotoUrl: item.fotoUrl || null
      });
    });
  });

  const finalStatus = naoConformes > 0 ? 'NÃO APROVADA' : 'APROVADA';

  const fullInspection: Inspection = {
    ...inspection,
    id: inspectionId,
    statusFinal: finalStatus,
    assinaturaRemoteUrl: signatureBase64 || inspection.assinaturaRemoteUrl || null,
    totalItens,
    itensConformes: conformes,
    itensNaoConformes: naoConformes,
    itensNA: na,
    syncStatus: 'SYNCED',
    timestamp: inspection.timestamp || now
  };

  // Salvar no Cache Local (Offline-first)
  try {
    saveToLocalCache(fullInspection, flattenedItems, photos);
  } catch (err) {
    console.warn('[Cache] Erro ao salvar inspeção localmente:', err);
  }

  const db = firestoreInstance;
  if (!db) {
    console.warn('[Firestore] Instância offline ou não disponível. Salvo no cache local.');
    return fullInspection;
  }

  try {
    const batch = writeBatch(db);

    // 1. Documento em 'inspecoes/{id}'
    const inspecaoDocRef = doc(db, INSPECTIONS_COLLECTION, inspectionId);
    batch.set(inspecaoDocRef, fullInspection);

    // 2. Subcoleção 'itens'
    flattenedItems.forEach((item) => {
      const itemRef = doc(db, INSPECTIONS_COLLECTION, inspectionId, 'itens', item.id);
      batch.set(itemRef, item);
    });

    // 3. Subcoleção 'fotos'
    photos.forEach((photo) => {
      const photoId = photo.id || crypto.randomUUID();
      const photoRef = doc(db, INSPECTIONS_COLLECTION, inspectionId, 'fotos', photoId);
      batch.set(photoRef, {
        ...photo,
        id: photoId,
        inspecaoId: inspectionId
      });
    });

    // 4. Compatibilidade com coleção legada 'checklists/{id}'
    const legacyChecklistDocRef = doc(db, CHECKLISTS_COLLECTION, inspectionId);
    const legacyChecklistData = {
      id: inspectionId,
      companyId: fullInspection.empresaId,
      empresaId: fullInspection.empresaId,
      empresaNome: fullInspection.empresaNome || '',
      userId: fullInspection.usuarioId,
      inspetor: fullInspection.inspetorNome || '',
      plataformaId: fullInspection.plataformaId,
      equipamento: fullInspection.modelo || '',
      modelo: fullInspection.modelo || '',
      numeroSerie: fullInspection.numeroSerie || '',
      proprietario: fullInspection.proprietario || '',
      locatario: fullInspection.locatario || '',
      horimetro: fullInspection.horimetro || '',
      tipoInspecao: fullInspection.tipoInspecao,
      status: fullInspection.statusFinal,
      statusFinal: fullInspection.statusFinal,
      justificativa: fullInspection.justificativa || '',
      signaturePath: signatureBase64 || '',
      assinaturaRemoteUrl: signatureBase64 || '',
      photo1: photos[0]?.base64Data || photos[0]?.remoteUrl || '',
      photo2: photos[1]?.base64Data || photos[1]?.remoteUrl || '',
      photo3: photos[2]?.base64Data || photos[2]?.remoteUrl || '',
      photo4: photos[3]?.base64Data || photos[3]?.remoteUrl || '',
      syncStatus: 'SYNCED',
      timestamp: fullInspection.timestamp
    };

    batch.set(legacyChecklistDocRef, legacyChecklistData);

    flattenedItems.forEach((item) => {
      const legacyItemRef = doc(db, CHECKLISTS_COLLECTION, inspectionId, 'items', item.id);
      batch.set(legacyItemRef, {
        id: item.id,
        checklistId: inspectionId,
        category: item.categoria,
        description: item.descricao,
        status: item.status === 'CONFORME' ? 'APROVADO' : item.status === 'NAO_CONFORME' ? 'REPROVADO' : 'N/A',
        observation: item.observacao || ''
      });
    });

    await batch.commit();
    console.log(`[Firestore] Inspeção ${inspectionId} salva e sincronizada com sucesso.`);
  } catch (error) {
    console.error(`[Firestore] Erro ao sincronizar inspeção ${inspectionId}:`, error);
    // Salvar status como FAILED mas manter no cache local
    fullInspection.syncStatus = 'FAILED';
  }

  return fullInspection;
}

/**
 * Busca inspeções associadas à empresa do usuário.
 */
export async function getInspections(empresaId: string): Promise<Inspection[]> {
  const localInspections = getFromLocalCache(empresaId);

  if (!firestoreInstance || !empresaId) {
    return localInspections;
  }

  try {
    const inspecoesRef = collection(firestoreInstance, INSPECTIONS_COLLECTION);
    const q = query(inspecoesRef, where('empresaId', '==', empresaId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Fallback para verificar se há registros na coleção legada 'checklists'
      const checklistsRef = collection(firestoreInstance, CHECKLISTS_COLLECTION);
      const qLegacy = query(checklistsRef, where('companyId', '==', empresaId));
      const legacySnapshot = await getDocs(qLegacy);

      if (!legacySnapshot.empty) {
        const legacyList: Inspection[] = legacySnapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            empresaId: d.companyId || d.empresaId || empresaId,
            empresaNome: d.empresaNome || '',
            usuarioId: d.userId || d.usuarioId || '',
            inspetorNome: d.inspetor || d.inspetorNome || '',
            plataformaId: d.plataformaId || '',
            modelo: d.modelo || d.equipamento || '',
            numeroSerie: d.numeroSerie || '',
            proprietario: d.proprietario || '',
            locatario: d.locatario || '',
            data: d.data || new Date(d.timestamp || Date.now()).toLocaleDateString('pt-BR'),
            hora: d.hora || new Date(d.timestamp || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            horimetro: d.horimetro || '0',
            tipoInspecao: d.tipoInspecao || 'PRE_USO',
            statusFinal: d.statusFinal || (d.status === 'APROVADA' ? 'APROVADA' : 'NÃO APROVADA'),
            justificativa: d.justificativa || null,
            assinaturaRemoteUrl: d.signaturePath || d.assinaturaRemoteUrl || null,
            timestamp: d.timestamp || Date.now(),
            syncStatus: 'SYNCED'
          };
        });

        return mergeWithLocalCache(legacyList, localInspections);
      }

      return localInspections;
    }

    const firestoreList: Inspection[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Inspection;
      return {
        ...data,
        id: docSnap.id
      };
    });

    // Ordenar decrescente por timestamp
    firestoreList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return mergeWithLocalCache(firestoreList, localInspections);
  } catch (error) {
    console.error('[Firestore] Erro ao buscar inspeções da empresa:', error);
    return localInspections;
  }
}

/**
 * Busca detalhes completos de uma inspeção (incluindo subcoleções de itens e fotos).
 */
export async function getInspectionDetails(inspectionId: string): Promise<{
  inspection: Inspection | null;
  itens: InspectionItem[];
  fotos: InspectionPhoto[];
}> {
  if (!firestoreInstance || !inspectionId) {
    const local = getSingleFromLocalCache(inspectionId);
    return {
      inspection: local?.inspection || null,
      itens: local?.itens || [],
      fotos: local?.fotos || []
    };
  }

  try {
    const docRef = doc(firestoreInstance, INSPECTIONS_COLLECTION, inspectionId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      // Tentar buscar na coleção legada
      const legacyRef = doc(firestoreInstance, CHECKLISTS_COLLECTION, inspectionId);
      const legacySnap = await getDoc(legacyRef);

      if (legacySnap.exists()) {
        const d = legacySnap.data();
        const itemsSnap = await getDocs(collection(firestoreInstance, CHECKLISTS_COLLECTION, inspectionId, 'items'));
        const itens: InspectionItem[] = itemsSnap.docs.map((itDoc) => {
          const it = itDoc.data();
          return {
            id: itDoc.id,
            inspecaoId: inspectionId,
            categoria: it.category || 'GERAL',
            descricao: it.description || '',
            status: it.status === 'APROVADO' ? 'CONFORME' : it.status === 'REPROVADO' ? 'NAO_CONFORME' : 'NA',
            observacao: it.observation || null
          };
        });

        const fotos: InspectionPhoto[] = [];
        ['photo1', 'photo2', 'photo3', 'photo4'].forEach((pKey, idx) => {
          if (d[pKey]) {
            fotos.push({
              id: `legacy_${idx}`,
              inspecaoId: inspectionId,
              remoteUrl: d[pKey].startsWith('data:') ? undefined : d[pKey],
              base64Data: d[pKey].startsWith('data:') ? d[pKey] : undefined,
              tipo: `FOTO_${idx + 1}`,
              timestamp: d.timestamp || Date.now()
            });
          }
        });

        const inspection: Inspection = {
          id: legacySnap.id,
          empresaId: d.companyId || d.empresaId || '',
          empresaNome: d.empresaNome || '',
          usuarioId: d.userId || '',
          inspetorNome: d.inspetor || '',
          plataformaId: d.plataformaId || '',
          modelo: d.modelo || d.equipamento || '',
          numeroSerie: d.numeroSerie || '',
          proprietario: d.proprietario || '',
          locatario: d.locatario || '',
          data: d.data || '',
          hora: d.hora || '',
          horimetro: d.horimetro || '0',
          tipoInspecao: d.tipoInspecao || 'PRE_USO',
          statusFinal: d.statusFinal || d.status || 'APROVADA',
          justificativa: d.justificativa || null,
          assinaturaRemoteUrl: d.signaturePath || d.assinaturaRemoteUrl || null,
          timestamp: d.timestamp || Date.now()
        };

        return { inspection, itens, fotos };
      }

      return { inspection: null, itens: [], fotos: [] };
    }

    const inspection = { ...(snap.data() as Inspection), id: snap.id };

    // Buscar subcoleção 'itens'
    const itensSnap = await getDocs(collection(firestoreInstance, INSPECTIONS_COLLECTION, inspectionId, 'itens'));
    const itens = itensSnap.docs.map((d) => ({ ...(d.data() as InspectionItem), id: d.id }));

    // Buscar subcoleção 'fotos'
    const fotosSnap = await getDocs(collection(firestoreInstance, INSPECTIONS_COLLECTION, inspectionId, 'fotos'));
    const fotos = fotosSnap.docs.map((d) => ({ ...(d.data() as InspectionPhoto), id: d.id }));

    return { inspection, itens, fotos };
  } catch (error) {
    console.error(`[Firestore] Erro ao buscar detalhes da inspeção ${inspectionId}:`, error);
    const local = getSingleFromLocalCache(inspectionId);
    return {
      inspection: local?.inspection || null,
      itens: local?.itens || [],
      fotos: local?.fotos || []
    };
  }
}

/**
 * Exclui uma inspeção do Firestore e do cache local.
 */
export async function deleteInspection(inspectionId: string): Promise<boolean> {
  // Remove do cache local
  deleteFromLocalCache(inspectionId);

  if (!firestoreInstance) return true;

  try {
    await deleteDoc(doc(firestoreInstance, INSPECTIONS_COLLECTION, inspectionId));
    try {
      await deleteDoc(doc(firestoreInstance, CHECKLISTS_COLLECTION, inspectionId));
    } catch {
      // ignore
    }
    return true;
  } catch (error) {
    console.error(`[Firestore] Erro ao excluir inspeção ${inspectionId}:`, error);
    return false;
  }
}

// -------------------------------------------------------------
// Plataformas / Equipamentos PEMT
// -------------------------------------------------------------

/**
 * Busca todas as plataformas registradas para a empresa.
 */
export async function getPlatforms(empresaId: string): Promise<Platform[]> {
  const localPlatforms = getPlatformsFromLocalCache(empresaId);

  if (!firestoreInstance || !empresaId) {
    return localPlatforms;
  }

  try {
    const platRef = collection(firestoreInstance, PLATFORMS_COLLECTION);
    const q = query(platRef, where('empresaId', '==', empresaId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return localPlatforms;
    }

    const list: Platform[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Platform;
      return {
        ...data,
        id: docSnap.id
      };
    });

    return list.length > 0 ? list : localPlatforms;
  } catch (error) {
    console.error('[Firestore] Erro ao buscar plataformas:', error);
    return localPlatforms;
  }
}

/**
 * Cadastra ou atualiza uma plataforma no Firestore e localmente.
 */
export async function savePlatform(platform: Platform): Promise<Platform> {
  const id = platform.id || crypto.randomUUID();
  const platformWithId: Platform = {
    ...platform,
    id,
    criadoEm: platform.criadoEm || Date.now()
  };

  savePlatformToLocalCache(platformWithId);

  if (firestoreInstance) {
    try {
      const platRef = doc(firestoreInstance, PLATFORMS_COLLECTION, id);
      await writeBatch(firestoreInstance).set(platRef, platformWithId).commit();
    } catch (err) {
      console.warn('[Firestore] Erro ao salvar plataforma no Firestore:', err);
    }
  }

  return platformWithId;
}

// -------------------------------------------------------------
// Funções Auxiliares de Cache Local (Offline-first)
// -------------------------------------------------------------

interface LocalCacheItem {
  inspection: Inspection;
  itens: InspectionItem[];
  fotos: InspectionPhoto[];
}

function getLocalCache(): LocalCacheItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToLocalCache(
  inspection: Inspection,
  itens: InspectionItem[],
  fotos: InspectionPhoto[]
) {
  const cache = getLocalCache().filter((c) => c.inspection.id !== inspection.id);
  cache.unshift({ inspection, itens, fotos });
  localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(cache.slice(0, 50)));
}

function deleteFromLocalCache(id: string) {
  const cache = getLocalCache().filter((c) => c.inspection.id !== id);
  localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(cache));
}

function getFromLocalCache(empresaId: string): Inspection[] {
  return getLocalCache()
    .filter((c) => !empresaId || c.inspection.empresaId === empresaId)
    .map((c) => c.inspection);
}

function getSingleFromLocalCache(id: string): LocalCacheItem | null {
  return getLocalCache().find((c) => c.inspection.id === id) || null;
}

function mergeWithLocalCache(remote: Inspection[], local: Inspection[]): Inspection[] {
  const map = new Map<string, Inspection>();
  remote.forEach((r) => map.set(r.id, r));
  local.forEach((l) => {
    if (!map.has(l.id)) {
      map.set(l.id, l);
    }
  });
  return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

function getPlatformsFromLocalCache(empresaId: string): Platform[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PLATFORMS_KEY);
    const list: Platform[] = raw ? JSON.parse(raw) : [];
    return list.filter((p) => !empresaId || p.empresaId === empresaId);
  } catch {
    return [];
  }
}

function savePlatformToLocalCache(plat: Platform) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PLATFORMS_KEY);
    const list: Platform[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((p) => p.id !== plat.id);
    filtered.push(plat);
    localStorage.setItem(LOCAL_STORAGE_PLATFORMS_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}
