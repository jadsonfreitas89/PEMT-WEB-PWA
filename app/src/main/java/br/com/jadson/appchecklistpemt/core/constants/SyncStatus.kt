package br.com.jadson.appchecklistpemt.core.constants

enum class SyncStatus {
    LOCAL,      // Salvo apenas localmente
    SYNCING,    // Em processo de sincronização
    SYNCED,     // Sincronizado com o Firestore/Storage
    FAILED      // Falha na sincronização
}
