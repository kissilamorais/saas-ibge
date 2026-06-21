import type { FunctionCode } from '@/types'

// Cargos do concurso IBGE (edital nº 01/2026). Cada candidato escolhe um;
// o catálogo de estudo é filtrado por essa escolha (profiles.target_function).
export const FUNCTIONS: {
  code: FunctionCode
  name: string
  short: string
  description: string
}[] = [
  {
    code: 'aca',
    name: 'Agente Censitário Administrativo',
    short: 'ACA',
    description: 'Apoio administrativo, gestão e rotinas de escritório do Censo.',
  },
  {
    code: 'aci',
    name: 'Agente Censitário de Informática',
    short: 'ACI',
    description: 'Suporte de TI, redes e equipamentos das unidades de coleta.',
  },
  {
    code: 'aor',
    name: 'Agente Operacional Regional',
    short: 'AOR',
    description: 'Apoio operacional e logístico às operações regionais.',
  },
  {
    code: 'acr',
    name: 'Agente Censitário Regional',
    short: 'ACR',
    description: 'Coordenação regional da coleta e supervisão de equipes.',
  },
  {
    code: 'acs',
    name: 'Agente Censitário Supervisor',
    short: 'ACS',
    description: 'Supervisão direta dos recenseadores em campo.',
  },
]

const CODES = FUNCTIONS.map((f) => f.code)

export function isFunctionCode(value: unknown): value is FunctionCode {
  return typeof value === 'string' && (CODES as string[]).includes(value)
}

export function getFunction(code: FunctionCode | null | undefined) {
  return FUNCTIONS.find((f) => f.code === code) ?? null
}
