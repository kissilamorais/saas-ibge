import { X } from 'lucide-react'

const PAINS = [
  'Você abre o edital e não sabe por onde começar.',
  'Perde horas em conteúdo que não cai.',
  'Faz questão sem entender o padrão da banca.',
  'Chega na prova achando que estudou — e trava.',
]

/**
 * Dor — fundo claro. Cada obstáculo vira uma linha com um "X" em círculo de
 * terracota suave (urgência sem gritar vermelho). Fecha com a frase-âncora.
 */
export function PainSection() {
  return (
    <section className="bg-[#FAFAF7] text-[#1F2421]">
      <div className="mx-auto max-w-3xl px-6 pb-14 pt-20 sm:pb-16 sm:pt-28">
        <h2 className="text-balance text-center font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Estudar pra concurso sem direção é jogar fora o seu tempo — e a sua
          aprovação.
        </h2>

        <ul className="mt-12 divide-y divide-black/[0.06] overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-sm">
          {PAINS.map((pain) => (
            <li key={pain} className="flex items-center gap-4 px-6 py-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D85A30]/10 text-[#D85A30]">
                <X className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span className="text-base text-[#3F4A45] sm:text-lg">{pain}</span>
            </li>
          ))}
        </ul>

        <p className="mt-12 text-center font-serif text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
          Enquanto isso, o prazo vai correndo.
          <br />
          <span className="text-[#D85A30]">A prova do IBGE não espera.</span>
        </p>
      </div>
    </section>
  )
}
