export const DEFAULT_MODELO_DS = 'claude-sonnet-4-6'
export const DEFAULT_MODELO_LP = 'claude-opus-4-6'

export const DEFAULT_PROMPT_DS = `Você receberá o código-fonte completo de uma landing page (HTML + CSS).
Analise tudo e gere um arquivo design-system.html completo, auto-contido e visualmente rico.

O arquivo deve documentar TODOS os seguintes elementos com exemplos renderizados:

IDENTIDADE VISUAL
- Paleta de cores completa: primária, secundária, accent, neutras, semânticas (sucesso/erro/alerta)
- Gradientes utilizados
- Background colors e superfícies

TIPOGRAFIA
- Famílias de fonte (display, body, mono) com exemplos reais
- Escala completa de tamanhos (h1 → h2 → h3 → p → small → caption)
- Pesos (font-weight) e line-heights
- Letter-spacing por nível

LAYOUT & ESPAÇAMENTO
- Escala de espaçamento identificada (4px, 8px, 16px, 24px, 32px...)
- Largura máxima do container e grid
- Breakpoints responsivos detectados
- Border-radius usados
- Padrão de padding de seções

COMPONENTES
- Botões: primário, secundário, ghost, outline — com hover state descrito
- Inputs e formulários
- Cards e containers
- Badges, tags, pills
- Separadores e divisores

DOBRAS / SEÇÕES DA LP
- Estrutura identificada de cada dobra (Hero, Benefícios, Prova Social, Oferta, CTA, etc.)
- Padrão visual de cada tipo de seção
- Como os CTAs são apresentados em cada dobra

EFEITOS & MOVIMENTO
- Box-shadows e text-shadows usados
- Animações e transições (CSS keyframes, transitions)
- Efeitos de hover
- Overlays, opacidades, blur

FORMATO DO OUTPUT:
- HTML único, auto-contido (sem CDN externo), com CSS inline no <style>
- Visual dark ou light seguindo o tema da LP original
- Cada seção bem delimitada com heading claro
- Swatches de cor renderizados como divs coloridos com hex values
- Todos os exemplos de tipografia renderizados nas fontes reais
- Botões e componentes renderizados funcionalmente
- Código-fonte limpo, organizado em seções com comentários

Responda APENAS com o HTML completo. Sem explicações, sem markdown. Comece com <!DOCTYPE html>.

CÓDIGO-FONTE DA LP:
`

export const DEFAULT_PROMPT_LP = `Você é um especialista em landing pages de alta conversão.
Você NÃO cria estilos novos. Você recombina padrões das referências fornecidas.

## BRIEFING DO PROJETO
Nome: {NOME}
Nicho: {NICHE} / {SUB_NICHE}
Tipo de página: {PAGE_TYPE}
Briefing: {BRIEFING}

## REFERÊNCIAS SELECIONADAS
{REFERENCIAS}

## REGRAS OBRIGATÓRIAS
1. Use APENAS classes CSS que existem nas referências acima. Não invente nenhuma nova classe.
2. Adapte o CONTEÚDO (textos, headings, CTAs, benefícios) ao briefing do projeto.
3. A estrutura de seções deve ser inspirada nas referências.
4. Gere uma landing page completa e funcional.
5. Retorne o HTML completo delimitado exatamente assim (sem nada antes ou depois das tags):

<LP_HTML>
{html completo da landing page, começando com <!DOCTYPE html>}
</LP_HTML>

6. Após o HTML, retorne o JSON de seções delimitado exatamente assim:

<LP_SECTIONS>
[{"id":"hero","label":"Hero","order":0,"html":"...HTML exato da seção..."},{"id":"beneficios","label":"Benefícios","order":1,"html":"..."}]
</LP_SECTIONS>

O "html" de cada seção deve ser um substring exato do HTML gerado acima.
Identifique de 4 a 8 seções principais (hero, problema, benefícios, prova social, oferta, cta, etc).`
