import { AxiosError } from "axios";

const MESSAGES: Record<number, string> = {
  400: "Alguns dados enviados são inválidos. Revise e tente novamente.",
  401: "Sua sessão expirou. Entre novamente para continuar.",
  403: "Você não tem permissão para fazer isso.",
  404: "Não encontramos o que você procurava.",
  409: "Esse registro já existe.",
  429: "Muitas ações em pouco tempo. Aguarde um instante e tente de novo.",
};

const FALLBACK = "Algo deu errado. Tente novamente em alguns instantes.";
const NETWORK_FALLBACK =
  "Não foi possível conectar ao servidor. Verifique sua internet e tente de novo.";

export function mapApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return NETWORK_FALLBACK;
    }
    const status = error.response.status;
    if (status >= 500) {
      return FALLBACK;
    }
    return MESSAGES[status] ?? FALLBACK;
  }
  return FALLBACK;
}
