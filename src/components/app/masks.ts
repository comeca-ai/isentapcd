/**
 * Máscaras e validadores dos formulários da área logada (design.md §8.7).
 * Funções puras — valor de entrada sempre string "crua" ou parcialmente formatada.
 */

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** 000.000.000-00 */
export function maskCPF(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/** 00000-000 */
export function maskCEP(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  return d.replace(/(\d{5})(\d)/, "$1-$2");
}

/** (00) 00000-0000 / (00) 0000-0000 */
export function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** DD/MM/AAAA */
export function maskDateBR(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  return d.replace(/(\d{2})(\d)/, "$1/$2").replace(/(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
}

/** DD/MM/AAAA → AAAA-MM-DD (contrato purchaseDate / laudoInfo.dataEmissao). */
export function dateBRToISO(value: string): string | undefined {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!m) return undefined;
  const [, dd, mm, yyyy] = m;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (
    date.getFullYear() !== Number(yyyy) ||
    date.getMonth() !== Number(mm) - 1 ||
    date.getDate() !== Number(dd)
  ) {
    return undefined;
  }
  return `${yyyy}-${mm}-${dd}`;
}

/** AAAA-MM-DD → DD/MM/AAAA (para pré-preencher a partir do perfil). */
export function isoToDateBR(value: string | null | undefined): string {
  if (!value) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** Validação completa de CPF (dígitos verificadores). */
export function isValidCPF(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false; // sequências repetidas
  const calc = (base: string, factor: number) => {
    let sum = 0;
    for (const ch of base) {
      sum += Number(ch) * factor;
      factor -= 1;
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(d.slice(0, 9), 10) === Number(d[9]) && calc(d.slice(0, 10), 11) === Number(d[10]);
}

export function cpfError(value: string): string | null {
  const d = onlyDigits(value);
  if (d.length === 0) return "Informe o CPF.";
  if (d.length < 11) return `CPF incompleto — faltam ${11 - d.length} dígito${11 - d.length > 1 ? "s" : ""}.`;
  if (!isValidCPF(d)) return "CPF inválido — confira os números digitados.";
  return null;
}

export function cepError(value: string): string | null {
  const d = onlyDigits(value);
  if (d.length === 0) return "Informe o CEP.";
  if (d.length < 8) return `CEP incompleto — faltam ${8 - d.length} dígito${8 - d.length > 1 ? "s" : ""}.`;
  return null;
}

export function phoneError(value: string): string | null {
  const d = onlyDigits(value);
  if (d.length === 0) return "Informe o telefone/WhatsApp.";
  if (d.length < 10) return "Telefone incompleto — inclua o DDD (ex.: 11 99999-0000).";
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/** Data legível em pt-BR a partir de Date/string. */
export function formatDateTime(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Lê um File como base64 (sem o prefixo data:...;base64,). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

/** base64 → objectURL (preview/download de blobs autenticados). */
export function base64ToObjectURL(dataBase64: string, mimeType: string): string {
  const bin = atob(dataBase64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}
