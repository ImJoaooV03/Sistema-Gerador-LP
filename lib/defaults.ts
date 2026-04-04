export const DEFAULT_MODELO_DS = 'claude-sonnet-4-6'
export const DEFAULT_MODELO_LP = 'claude-opus-4-6'

export const DEFAULT_PROMPT_DS = `Você é um Design System Showcase Builder especialista.
O HTML abaixo já está COMPLETAMENTE RESOLVIDO: CSS embutido em <style>, JS embutido em <script>, imagens e fontes em base64 data URIs. Tudo funciona sem dependências externas.

REGRAS ABSOLUTAS — violação = falha total:
1. Responda APENAS com HTML puro. Zero markdown, zero \`\`\`, zero explicações.
2. Comece com <!DOCTYPE html> na primeira linha, sem nada antes.
3. O HTML deve ser completamente auto-suficiente.
4. NÃO invente estilos novos. NÃO crie classes novas. APENAS reutilize o que existe no source.
5. Use a paleta de cores do site como fundo da página de documentação (não force branco).

ESTRUTURA EXATA (nesta ordem, sem pular seções):

━━━ NAV FIXO ━━━
<nav> fixo no topo (position:fixed; top:0; z-index:9999; width:100%)
Use a cor de fundo principal do site.
Links âncora: HERO · TYPOGRAPHY · COLORS · COMPONENTS · LAYOUT · MOTION · ICONS
Estilo consistente com o site original (fonte, tamanho, espaçamento).

━━━ SEÇÃO 0: HERO ━━━
id="hero"
Clone EXATO do hero do site original:
- Mesmo HTML estrutural
- Mesmas classes CSS
- Mesmos assets (os base64 já estão no source — reuse-os)
- Mesmas animações e transições
- Mesmo background, botões, componentes UI
Única mudança permitida: substitua os textos do hero para apresentar o Design System da marca.
Exemplo: heading principal → "[Nome da Marca] — Design System"
Mantenha hierarquia de texto similar (H1 + subtítulo + CTA).
PROIBIDO: alterar layout, espaçamento, animações, remover ou adicionar elementos.

━━━ SEÇÃO 1: TYPOGRAPHY ━━━
id="typography"
Tabela vertical de estilos tipográficos. Para cada estilo:
| Nome do estilo | Preview ao vivo (elemento e classes originais) | Tamanho / line-height |
Incluir APENAS estilos que existem no source, nesta ordem:
Heading 1, Heading 2, Heading 3, Heading 4,
Bold L / Bold M / Bold S,
Paragraph (body largo, se existir),
Regular L / Regular M / Regular S
Se um estilo usa gradient text, mostre-o exatamente igual.
Mostre o nome de cada família de fonte detectada.

━━━ SEÇÃO 2: COLORS & SURFACES ━━━
id="colors"
Grid de swatches 72×72px com hex + nome para cada cor.
Grupos: PRIMÁRIAS | NEUTRAS | SEMÂNTICAS
Inclua também:
- Backgrounds (página, seção, card, glass/blur se existir) como faixas largas
- Borders e dividers como linhas com hex
- Gradients como swatches horizontais + contexto de uso (ex: "hero background")

━━━ SEÇÃO 3: COMPONENTS ━━━
id="components"
Para cada componente que existe no source, mostrar estados lado a lado:
DEFAULT · HOVER · ACTIVE · DISABLED (apenas estados que fazem sentido para o componente)
Componentes obrigatórios (se existirem): botões primário, secundário, outline; badges/pills; cards; inputs; separadores.
Use as classes e markup originais. Mostre os CTAs reais do site.

━━━ SEÇÃO 4: LAYOUT & SPACING ━━━
id="layout"
- Max-width do container e grid (colunas, gaps)
- 2-3 padrões de layout reais (hero layout, grid de cards, split section) como mini-previews
- Escala de espaçamento visual: blocos coloridos mostrando 4px · 8px · 16px · 24px · 32px · 48px · 64px
- Border-radius utilizado (swatches)

━━━ SEÇÃO 5: MOTION ━━━
id="motion"
Motion Gallery: um card por animation class/keyframe presente no source.
Cada card: nome da classe + elemento de demo ao vivo (animação rodando) + descrição do comportamento.
Categorias: Entrance · Hover · Button transitions · Scroll/reveal (somente se existirem).

━━━ SEÇÃO 6: ICONS ━━━
id="icons"
APENAS SE ícones existirem no source.
Grid com todos os ícones, variantes de tamanho, herança de cor. Mesmo markup e classes.
Se não existirem ícones, OMITA esta seção completamente.

━━━ FIM ━━━
Feche </body></html> corretamente.

CÓDIGO-FONTE RESOLVIDO DA LP:
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
