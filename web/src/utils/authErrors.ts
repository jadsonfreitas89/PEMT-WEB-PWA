/**
 * Utilitário para conversão de erros técnicos do Firebase Auth em mensagens amigáveis para o usuário.
 * Mantém o registro técnico no console para diagnóstico de desenvolvimento.
 */

export function mapAuthError(error: unknown): string {
  // Sempre registra o erro real no console para depuração
  console.error('[Auth Error]', error);

  if (!error) {
    return 'Ocorreu um erro inesperado. Tente novamente.';
  }

  const rawCode =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  const rawMessage =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error);

  const errorString = `${rawCode} ${rawMessage}`.toLowerCase();

  if (errorString.includes('auth/invalid-credential') || errorString.includes('auth/wrong-password') || errorString.includes('invalid-credential') || errorString.includes('wrong-password')) {
    return 'Usuário ou senha incorretos.';
  }

  if (errorString.includes('auth/user-not-found') || errorString.includes('user-not-found')) {
    return 'Usuário não encontrado.';
  }

  if (errorString.includes('auth/email-already-in-use') || errorString.includes('email-already-in-use')) {
    return 'Este usuário já está cadastrado. Faça login com sua senha.';
  }

  if (errorString.includes('auth/invalid-email') || errorString.includes('invalid-email')) {
    return 'O formato do usuário é inválido.';
  }

  if (errorString.includes('auth/weak-password') || errorString.includes('weak-password')) {
    return 'A senha é muito fraca. Utilize no mínimo 6 caracteres.';
  }

  if (errorString.includes('auth/user-disabled') || errorString.includes('user-disabled')) {
    return 'Esta conta de usuário foi desativada. Entre em contato com o suporte.';
  }

  if (errorString.includes('auth/too-many-requests') || errorString.includes('too-many-requests')) {
    return 'Muitas tentativas consecutivas. Por segurança, tente novamente mais tarde.';
  }

  if (errorString.includes('auth/popup-closed-by-user') || errorString.includes('popup-closed-by-user')) {
    return 'O login com Google foi cancelado na janela pop-up.';
  }

  if (errorString.includes('auth/popup-blocked') || errorString.includes('popup-blocked')) {
    return 'A janela pop-up de login foi bloqueada pelo navegador. Permita pop-ups para este site.';
  }

  if (errorString.includes('auth/network-request-failed') || errorString.includes('network-request-failed') || errorString.includes('network error')) {
    return 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.';
  }

  if (errorString.includes('auth/requires-recent-login') || errorString.includes('requires-recent-login')) {
    return 'Esta operação requer autenticação recente. Faça login novamente.';
  }

  if (errorString.includes('auth/unverified-email') || errorString.includes('unverified-email')) {
    return 'É necessário verificar seu usuário antes de prosseguir.';
  }

  if (errorString.includes('auth/internal-error') || errorString.includes('internal-error')) {
    return 'Erro interno de autenticação. Verifique se o provedor de E-mail/Senha está ativado no Console do Firebase (Authentication > Sign-in method).';
  }

  return 'Não foi possível completar a operação. Verifique os dados e tente novamente.';
}
