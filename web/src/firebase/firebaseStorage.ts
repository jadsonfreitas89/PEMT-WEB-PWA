import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  type StorageReference,
  type UploadMetadata
} from 'firebase/storage';
import { storageInstance } from './firebaseApp';

/**
 * Interface padronizada para o resultado de uploads no Firebase Storage.
 */
export interface StorageUploadResult {
  storagePath: string;
  downloadUrl?: string;
  bytesTransferred: number;
  contentType?: string;
}

/**
 * Interface para o relatório do teste controlado de diagnóstico do Storage.
 */
export interface StorageDiagnosticResult {
  success: boolean;
  step: 'INITIALIZE' | 'UPLOAD' | 'DOWNLOAD_URL' | 'DELETE' | 'COMPLETED';
  storagePath?: string;
  downloadUrl?: string;
  error?: string;
  errorCode?: string;
  cleanupCompleted?: boolean;
}

/**
 * Helpers para padronização de caminhos no Firebase Storage.
 * O storagePath gerado é a chave mestra a ser gravada no Firestore (nunca gravar Base64).
 */
export const StoragePaths = {
  fotoInspecao: (empresaId: string, inspecaoId: string, fotoId: string): string => {
    const cleanEmpresa = empresaId.trim();
    const cleanInspecao = inspecaoId.trim();
    const cleanFoto = fotoId.trim();
    return `empresas/${cleanEmpresa}/inspecoes/${cleanInspecao}/fotos/${cleanFoto}.jpg`;
  },

  assinaturaInspecao: (empresaId: string, inspecaoId: string): string => {
    const cleanEmpresa = empresaId.trim();
    const cleanInspecao = inspecaoId.trim();
    return `empresas/${cleanEmpresa}/inspecoes/${cleanInspecao}/assinatura.png`;
  },

  laudoPdf: (empresaId: string, inspecaoId: string): string => {
    const cleanEmpresa = empresaId.trim();
    const cleanInspecao = inspecaoId.trim();
    return `empresas/${cleanEmpresa}/inspecoes/${cleanInspecao}/laudo.pdf`;
  },

  testDiagnostic: (timestamp = Date.now()): string => {
    return `_test/firebase-storage/diagnostico_${timestamp}.txt`;
  }
};

/**
 * Obtém a referência de um arquivo no Storage a partir do caminho relativo.
 */
export function getStorageFileRef(storagePath: string): StorageReference {
  if (!storageInstance) {
    throw new Error('Firebase Storage não inicializado no runtime da aplicação.');
  }
  return ref(storageInstance, storagePath);
}

/**
 * Envia um Blob, Buffer ou Uint8Array para o caminho especificado no Firebase Storage.
 */
export async function uploadStorageFile(
  storagePath: string,
  data: Blob | Uint8Array | ArrayBuffer,
  metadata?: UploadMetadata
): Promise<StorageUploadResult> {
  if (!storageInstance) {
    throw new Error('Firebase Storage não inicializado no runtime da aplicação.');
  }

  const fileRef = ref(storageInstance, storagePath);
  const snapshot = await uploadBytes(fileRef, data, metadata);

  let downloadUrl: string | undefined;
  try {
    downloadUrl = await getDownloadURL(fileRef);
  } catch (urlErr) {
    console.warn(`[FirebaseStorage] Upload concluído em ${storagePath}, mas URL não pôde ser gerada imediatamente:`, urlErr);
  }

  return {
    storagePath,
    downloadUrl,
    bytesTransferred: snapshot.metadata.size,
    contentType: snapshot.metadata.contentType
  };
}

/**
 * Obtém a URL pública de download de um arquivo quando permitido pelas regras do Storage.
 */
export async function getStorageDownloadUrl(pathOrRef: string | StorageReference): Promise<string> {
  if (!storageInstance) {
    throw new Error('Firebase Storage não inicializado no runtime da aplicação.');
  }

  const fileRef = typeof pathOrRef === 'string' ? ref(storageInstance, pathOrRef) : pathOrRef;
  return await getDownloadURL(fileRef);
}

/**
 * Exclui um arquivo do Firebase Storage (somente quando explicitamente solicitado).
 */
export async function deleteStorageFile(pathOrRef: string | StorageReference): Promise<boolean> {
  if (!storageInstance) {
    throw new Error('Firebase Storage não inicializado no runtime da aplicação.');
  }

  const fileRef = typeof pathOrRef === 'string' ? ref(storageInstance, pathOrRef) : pathOrRef;
  try {
    await deleteObject(fileRef);
    return true;
  } catch (error) {
    console.error(`[FirebaseStorage] Erro ao excluir arquivo:`, error);
    throw error;
  }
}

/**
 * Executa um teste de diagnóstico manual e controlado no Firebase Storage.
 *
 * NOTA DE SEGURANÇA:
 * - NÃO é executado automaticamente em produção ou no carregamento de páginas.
 * - Utiliza exclusivamente o diretório `_test/firebase-storage/`.
 * - Nunca afeta empresas, inspeções ou arquivos históricos reais.
 * - Exclui o arquivo de teste ao término para não deixar resíduos no Storage.
 */
export async function runControlledStorageDiagnostic(
  customBlob?: Blob,
  autoDelete = true
): Promise<StorageDiagnosticResult> {
  if (!storageInstance) {
    return {
      success: false,
      step: 'INITIALIZE',
      error: 'Firebase Storage (storageInstance) não está disponível ou não foi inicializado.'
    };
  }

  const testPath = StoragePaths.testDiagnostic();
  const testPayload = customBlob || new Blob(
    [`Teste de conectividade Firebase Storage PEMT: ${new Date().toISOString()}`],
    { type: 'text/plain' }
  );

  let downloadUrl: string | undefined;

  try {
    // 1. Upload
    const fileRef = ref(storageInstance, testPath);
    await uploadBytes(fileRef, testPayload, {
      contentType: 'text/plain',
      customMetadata: { testOrigin: 'PEMT_Storage_Diagnostic' }
    });

    // 2. Obter URL de download
    try {
      downloadUrl = await getDownloadURL(fileRef);
    } catch (urlErr: unknown) {
      const err = urlErr as { code?: string; message?: string };
      return {
        success: false,
        step: 'DOWNLOAD_URL',
        storagePath: testPath,
        errorCode: err.code,
        error: `Upload efetuado, mas falha ao obter URL de download (Possível Storage Rule): ${err.message || String(urlErr)}`
      };
    }

    // 3. Limpeza automática (se solicitado)
    let cleanupCompleted = false;
    if (autoDelete) {
      try {
        await deleteObject(fileRef);
        cleanupCompleted = true;
      } catch (delErr: unknown) {
        const err = delErr as { code?: string; message?: string };
        console.warn(`[FirebaseStorage Diagnostic] Aviso: Falha ao deletar arquivo temporário de teste:`, delErr);
        return {
          success: true,
          step: 'DELETE',
          storagePath: testPath,
          downloadUrl,
          cleanupCompleted: false,
          errorCode: err.code,
          error: `Upload e leitura bem sucedidos, mas a exclusão falhou: ${err.message || String(delErr)}`
        };
      }
    }

    return {
      success: true,
      step: 'COMPLETED',
      storagePath: testPath,
      downloadUrl,
      cleanupCompleted
    };
  } catch (uploadErr: unknown) {
    const err = uploadErr as { code?: string; message?: string };
    return {
      success: false,
      step: 'UPLOAD',
      storagePath: testPath,
      errorCode: err.code,
      error: `Erro ao enviar arquivo para o Storage: ${err.message || String(uploadErr)}`
    };
  }
}
