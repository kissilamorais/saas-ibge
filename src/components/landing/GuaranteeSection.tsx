import { ShieldCheck } from 'lucide-react'

/**
 * Garantia — fundo claro. Selo dourado tipo carimbo (círculo com anel tracejado
 * e "7 DIAS") ao lado do texto, com ShieldCheck. Toque premium e de segurança.
 */
export function GuaranteeSection() {
  return (
    <section className="bg-[#FAFAF7] text-[#1F2421]">
      <div className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
        <div className="flex flex-col items-center gap-10 rounded-3xl border border-[#D4A017]/25 bg-gradient-to-b from-[#FAF3E2] to-white p-8 text-center shadow-sm sm:flex-row sm:gap-12 sm:p-12 sm:text-left">
          {/* Selo / carimbo dourado. */}
          <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
            <span className="absolute inset-0 rounded-full border-2 border-dashed border-[#D4A017]/40" />
            <span className="absolute inset-2.5 rounded-full border border-[#D4A017]/30" />
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-gradient-to-br from-[#D4A017] to-[#B8860B] text-white shadow-[0_10px_30px_-8px_rgba(184,134,11,0.6)]">
              <ShieldCheck className="h-7 w-7" strokeWidth={2} />
              <span className="mt-1 font-serif text-2xl font-bold leading-none">
                7 dias
              </span>
              <span className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-white/85">
                Garantia
              </span>
            </div>
          </div>

          <div className="flex-1">
            <h2 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
              Garantia blindada de 7 dias
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[#5F6B66] sm:text-lg">
              Entra, testa tudo — plataforma, questões, simulados, cronograma. Se
              em 7 dias você achar que não é pra você, me manda uma mensagem e
              devolvo 100% do valor.
            </p>
            <p className="mt-5 text-base font-semibold text-[#1F2421] sm:text-lg">
              Sem burocracia. Sem pergunta. Sem enrolação.{' '}
              <span className="text-[#B8860B]">O risco é todo meu.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
