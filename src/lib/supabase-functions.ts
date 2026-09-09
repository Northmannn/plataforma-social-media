import { supabase } from "@/integrations/supabase/client";

/**
 * Edge functions sinalizam falha com status 4xx e um corpo `{ error }`.
 * O supabase-js transforma isso num FunctionsHttpError genérico
 * ("Edge Function returned a non-2xx status code") e descarta o corpo,
 * então a mensagem real nunca chega na UI. Aqui recuperamos o corpo
 * da Response guardada em `error.context`.
 */
export const extractFunctionError = async (error: unknown): Promise<string> => {
  const context = (error as { context?: unknown })?.context;

  if (context instanceof Response) {
    try {
      const body = await context.clone().json();
      if (body && typeof body === "object" && "error" in body && body.error) {
        return String((body as { error: unknown }).error);
      }
    } catch {
      try {
        const text = (await context.clone().text()).trim();
        if (text) return text;
      } catch {
        // corpo já consumido ou ilegível — cai no fallback abaixo
      }
    }
  }

  // FunctionsFetchError: a requisição nem saiu — função não deployada (o 404 do
  // gateway não devolve cabeçalhos CORS), offline ou preflight bloqueado.
  if ((error as { name?: string })?.name === "FunctionsFetchError") {
    return "Não foi possível contatar a Edge Function. Verifique se ela foi deployada e se você está online.";
  }

  if (error instanceof Error && error.message) return error.message;
  return "Erro desconhecido ao chamar a função";
};

/** Invoca uma edge function e lança um Error com a mensagem real em caso de falha. */
export const invokeFunction = async <T>(name: string, body?: unknown): Promise<T> => {
  const { data, error } = await supabase.functions.invoke(name, { body });

  if (error) {
    throw new Error(await extractFunctionError(error));
  }

  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(String((data as { error: unknown }).error));
  }

  return data as T;
};
