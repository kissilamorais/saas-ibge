interface Shot {
  /** Captura de desktop (1440 px de viewport). */
  src: string
  width: number
  height: number
  /** Mesma tela num celular — no desktop o print encolhido vira borrão. */
  mobileSrc: string
  mobileWidth: number
  mobileHeight: number
  alt: string
  title: string
  desc: string
  /** Caminho exibido na barra falsa do navegador. */
  path: string
}

/**
 * A copy segue de propósito a ordem da `PainSection`: cada uma das quatro dores
 * listadas lá em cima ganha, aqui, a tela que a resolve. É o que transforma a
 * seção de vitrine em resposta — quem rolou até aqui já sabe qual é o problema
 * dele e reconhece o próprio na legenda.
 *
 *   1. "não sabe por onde começar"          → painel
 *   2. "gasta horas no que a IBFC não cobra" → módulos
 *   3. "não reconhece o padrão da banca"     → questão comentada
 *   4. "trava na prova e não entende o erro" → simulado
 */
const PAINEL: Shot = {
  src: '/plataforma/dashboard.webp',
  width: 2160,
  height: 968,
  mobileSrc: '/plataforma/dashboard-mobile.webp',
  mobileWidth: 780,
  mobileHeight: 1688,
  alt: 'Painel do Aprovus mostrando a contagem regressiva para a prova, sequência de 12 dias seguidos de estudo, metas diária e semanal em 100% e conquistas desbloqueadas.',
  title: 'Você entra e já sabe o que estudar hoje',
  desc: 'Sem abrir o edital e travar. A tela começa pela próxima lição, mostra quanto falta para a prova e quanto você já andou na semana. Um clique em "Continuar de onde parei" e a decisão do dia acabou.',
  path: '/dashboard',
}

const TELAS: Shot[] = [
  {
    src: '/plataforma/modulos.webp',
    width: 1400,
    height: 812,
    mobileSrc: '/plataforma/modulos-mobile.webp',
    mobileWidth: 780,
    mobileHeight: 1688,
    alt: 'Tela de módulos do Aprovus com Revisão Intensiva, Português, Raciocínio Lógico e Administração, cada um com barra de progresso, e o edital em 97% concluído.',
    title: 'Só o que a banca cobra — e quanto falta',
    desc: 'A Revisão Intensiva é o filtro: o essencial da IBFC, sem o resto do mundo. E a porcentagem de cada matéria é medida em cima do edital de verdade, não em "aulas assistidas".',
    path: '/dashboard/modules',
  },
  {
    src: '/plataforma/questao-comentada.webp',
    width: 1400,
    height: 664,
    mobileSrc: '/plataforma/questao-comentada-mobile.webp',
    mobileWidth: 780,
    mobileHeight: 1688,
    alt: 'Questão de português no Aprovus com a alternativa correta destacada em verde e um comentário explicando por que ela está certa.',
    title: 'O comentário é onde você aprende a pegadinha',
    desc: 'Você responde, o gabarito aparece na hora e o porquê vem junto. É lendo esse "por quê", questão atrás de questão, que o padrão da banca para de te pegar de surpresa.',
    path: '/dashboard/practice',
  },
  {
    src: '/plataforma/simulado.webp',
    width: 1400,
    height: 998,
    mobileSrc: '/plataforma/simulado-mobile.webp',
    mobileWidth: 780,
    mobileHeight: 1688,
    alt: 'Simulado do Aprovus em andamento, com cronômetro de 4 horas, mapa das 60 questões e a primeira questão aberta.',
    title: 'A prova antes da prova',
    desc: '60 questões, 4 horas no cronômetro e o mapa da prova do lado. Você descobre onde trava agora, com tempo de corrigir — e não no dia em que não dá mais.',
    path: '/dashboard/exams',
  },
]

/**
 * Moldura da captura.
 *
 * No desktop, ganha uma barra de navegador com o domínio e a rota reais — é o
 * que faz o visitante entender num relance que aquilo é software rodando, e não
 * um mockup de peça publicitária. No celular a barra sai (a captura já é de um
 * navegador de celular) e a imagem fica na largura de um aparelho.
 *
 * `<picture>` em vez de `next/image` porque aqui é troca de arte, não de
 * resolução: desktop e celular são capturas diferentes, com proporções
 * diferentes. O `media` garante que o navegador baixe só a que vai usar — dois
 * `<img>` escondidos por CSS baixariam as duas.
 */
function BrowserFrame({ shot }: { shot: Shot }) {
  return (
    <figure className="mx-auto max-w-[268px] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/30 ring-1 ring-white/10 sm:max-w-[300px] lg:max-w-none">
      <div className="hidden items-center gap-2 border-b border-black/[0.07] bg-[#F1F1EE] px-4 py-2.5 lg:flex">
        <span aria-hidden className="flex shrink-0 gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-black/[0.13]" />
          <span className="h-2.5 w-2.5 rounded-full bg-black/[0.13]" />
          <span className="h-2.5 w-2.5 rounded-full bg-black/[0.13]" />
        </span>
        <span className="mx-auto max-w-[75%] truncate rounded-md bg-white px-3 py-0.5 text-[0.7rem] text-[#5F6B66] ring-1 ring-black/[0.06]">
          portalaprovus.com.br{shot.path}
        </span>
      </div>
      <picture>
        <source
          media="(min-width: 1024px)"
          srcSet={shot.src}
          width={shot.width}
          height={shot.height}
        />
        <img
          src={shot.mobileSrc}
          width={shot.mobileWidth}
          height={shot.mobileHeight}
          alt={shot.alt}
          loading="lazy"
          decoding="async"
          className="block h-auto w-full"
        />
      </picture>
    </figure>
  )
}

/**
 * Por dentro da plataforma — capturas reais das telas de estudo.
 *
 * Fundo petróleo por dois motivos: mantém o ritmo claro→escuro ao rolar (vem
 * depois da Solução, clara) e as telas do produto são claras, então o contraste
 * faz cada captura saltar em vez de derreter no fundo.
 *
 * O layout é uma captura larga + três linhas alternadas, e não uma grade de
 * miniaturas: em três colunas o texto das telas fica ilegível, e print que não
 * se lê é enfeite, não prova.
 *
 * As imagens vivem em `public/plataforma/` e saem de uma conta de demonstração
 * com progresso avançado (ver `scripts/demo-seed-progress.mjs`) — painel zerado
 * não vende. Para regravar: rodar o seed, subir a build e capturar de novo.
 */
export function PlatformSection() {
  return (
    <section className="bg-[#0B3D2E] text-white">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#D4A017]">
          Por dentro da plataforma
        </p>
        <h2 className="mx-auto mt-4 max-w-3xl text-balance text-center font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Cada problema lá de cima tem uma tela aqui embaixo.
        </h2>
        {/* "Conta de demonstração", e não "conta de um aluno": o progresso é
            sintético (scripts/demo-seed-progress.mjs). Sugerir aluno real seria
            depoimento falso — e o número não fica menos convincente por ser
            honesto. */}
        <p className="mx-auto mt-5 max-w-2xl text-balance text-center text-base leading-relaxed text-white/70 sm:text-lg">
          Nada de mockup: são capturas do Aprovus rodando, numa conta de
          demonstração com o edital quase fechado. É isso que abre quando você
          entra.
        </p>

        {/* Captura larga: a tela que o aluno mais vê. */}
        <div className="mt-14 sm:mt-16">
          <BrowserFrame shot={PAINEL} />
          <div className="mx-auto mt-6 max-w-2xl text-center">
            <h3 className="text-balance font-serif text-xl font-semibold tracking-tight sm:text-2xl">
              {PAINEL.title}
            </h3>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-white/70 sm:text-base">
              {PAINEL.desc}
            </p>
          </div>
        </div>

        {/* Linhas alternadas: imagem e texto trocam de lado a cada bloco. */}
        <div className="mt-16 space-y-16 sm:mt-24 sm:space-y-24">
          {TELAS.map((shot, i) => (
            <div
              key={shot.src}
              className="grid items-center gap-8 lg:grid-cols-12 lg:gap-14"
            >
              <div
                className={
                  i % 2 === 1
                    ? 'lg:col-span-7 lg:col-start-6 lg:row-start-1'
                    : 'lg:col-span-7'
                }
              >
                <BrowserFrame shot={shot} />
              </div>
              <div
                className={
                  i % 2 === 1
                    ? 'text-center lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:text-left'
                    : 'text-center lg:col-span-5 lg:text-left'
                }
              >
                <h3 className="text-balance font-serif text-xl font-semibold tracking-tight sm:text-2xl">
                  {shot.title}
                </h3>
                <p className="mx-auto mt-3 max-w-md text-pretty text-sm leading-relaxed text-white/70 sm:text-base lg:mx-0">
                  {shot.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Fecho que emenda na Oferta — mesmo papel da última linha da Solução.
            "Tudo isso" são as quatro telas acima, todas liberadas na hora; os
            bônus com desbloqueio temporal ficam de fora da frase de propósito
            (o Resumo Estratégico e a Simulação Final não abrem no ato). */}
        <p className="mx-auto mt-20 max-w-2xl text-balance text-center font-serif text-xl font-medium leading-snug tracking-tight sm:mt-24 sm:text-2xl">
          Tudo isso abre no minuto em que o pagamento cai.
        </p>
      </div>
    </section>
  )
}
