# Extract DS v2 — Design Spec

**Date:** 2026-04-04  
**Scope:** Melhorar a extração de design system para produzir um HTML perfeito, auto-suficiente e visualmente fiel ao site original.

---

## Problema

O `design-system.html` gerado atualmente tem dois problemas críticos:

1. **Hero em branco / texto literal ` ```html `**: O CSS original não está disponível na página gerada, então as classes do clone do hero não têm estilos. Às vezes o markdown leaks através do stripping incompleto.
2. **Seções incompletas**: O prompt atual não garante completude das seções de documentação (tipografia, componentes, motion, etc.).

---

## Solução: Pré-processamento do ZIP + Prompt Reescrito

### Arquivos afetados

- `app/(app)/design-systems/api/extract-ds/route.ts`
- `lib/defaults.ts`

---

## 1. Pré-processamento do ZIP (route.ts)

Antes de chamar Claude, a rota monta um **HTML completamente resolvido** (`resolvedHtml`):

### Passos em ordem

1. **Ler `index.html`** da raiz do ZIP
2. **Embutir CSS linkado**: varrer `<link href="*.css">`, ler cada arquivo do ZIP, substituir a tag `<link>` por `<style>` inline com o conteúdo
3. **Embutir JS linkado**: varrer `<script src="...">`, ler cada arquivo do ZIP, substituir a tag por `<script>` inline com o conteúdo (necessário para animações JS)
4. **Resolver assets** (imagens, SVGs, fontes): varrer todos os atributos `src=`, `href=` e `url()` no CSS inline:
   - Se o asset existir no ZIP e tiver **≤ 500KB**: converter para base64 data URI (`data:image/png;base64,...`)
   - Se o asset existir no ZIP e tiver **> 500KB**: substituir por placeholder SVG inline (`data:image/svg+xml,...` cinza com dimensões aproximadas)
   - Se o asset não existir no ZIP: deixar como está
5. **Resultado**: `resolvedHtml` é um HTML string 100% auto-suficiente (zero dependências externas)

### Cap de contexto

- Manter cap de `~120k chars` para o `resolvedHtml` enviado ao Claude
- Se ultrapassar, truncar CSS de menor prioridade (não truncar o HTML estrutural nem assets críticos)

---

## 2. Prompt reescrito (`DEFAULT_PROMPT_DS`)

### Contexto passado ao Claude

```
[resolvedHtml completo, auto-suficiente]
```

### Instruções do prompt

**Regras absolutas:**
- Responder APENAS com HTML puro. Sem markdown, sem ``` fences, sem explicações
- Começar com `<!DOCTYPE html>` na primeira linha
- O HTML deve ser completamente auto-suficiente (todos os assets já estão no source que foi fornecido — reuse-os)
- Não inventar estilos novos. Não criar classes novas. Apenas reusar o que existe no source

**Nav fixo no topo:**
- Horizontal, fixo (`position: fixed; top: 0`)
- Links âncora para cada seção: HERO · TYPOGRAPHY · COLORS · COMPONENTS · LAYOUT · MOTION · ICONS
- Usar mesma paleta de cores do site original

**Seção 0 — Hero Clone:**
- Copiar a estrutura exata do hero do site original (mesmo HTML, mesmas classes, mesmos assets)
- Única mudança permitida: substituir textos para apresentar "Design System — [Nome da Marca]"
- Manter layout, animações, background, botões, componentes UI idênticos

**Seção 1 — Typography:**
- Tabela vertical: nome do estilo | preview ao vivo com elemento e classes originais | tamanho/line-height
- Incluir apenas estilos que existem no source
- Ordem: H1, H2, H3, H4, Bold variants, Paragraph, Regular variants

**Seção 2 — Colors & Surfaces:**
- Swatches 72×72px para cada cor identificada
- Agrupados: Primárias | Neutras | Semânticas
- Mostrar: backgrounds, borders, gradients (como swatches + contexto de uso)

**Seção 3 — Components:**
- Renderizar cada componente com estados lado a lado: default / hover / active / disabled
- Incluir apenas componentes que existem no source: botões, inputs, cards, badges, etc.
- Usar classes e markup originais

**Seção 4 — Layout & Spacing:**
- Containers, grids, colunas, paddings de seção
- 2-3 padrões reais do site (hero layout, grid de cards, split section)
- Escala de espaçamento visual: 4px, 8px, 16px, 24px, 32px, 48px, 64px

**Seção 5 — Motion Gallery:**
- Demonstrar cada classe/keyframe de animação presente no source
- Cards com preview ao vivo: entrance animations, hover lifts/glows, button transitions
- Usar as classes originais nos elementos de demo

**Seção 6 — Icons** (apenas se existirem no source):
- Grid com todos os ícones do sistema
- Variantes de tamanho e herança de cor
- Mesmo markup e classes

**Fundo da página doc:** usar a cor de fundo principal do site (não branco forçado), para que os componentes não fiquem com contraste estranho.

---

## 3. Stripping mais robusto (route.ts)

Substituir o stripping atual por:

```ts
// Remove qualquer code fence markdown
dsHtml = dsHtml.replace(/^```[\w]*\n?/i, '').replace(/\n?```\s*$/i, '').trim()

// Se ainda não começar com <!DOCTYPE, tentar extrair o bloco HTML
if (!dsHtml.toLowerCase().startsWith('<!doctype')) {
  const match = dsHtml.match(/<!DOCTYPE[\s\S]*/i)
  if (match) dsHtml = match[0].trim()
}
```

---

## 4. Parâmetros da chamada Claude

- `max_tokens`: aumentar de `16_000` para `32_000`
- `model`: manter `DEFAULT_MODELO_DS` (claude-sonnet-4-6)

---

## Resultado esperado

- Hero idêntico ao original, com animações funcionando, assets carregando
- Documentação completa: tipografia, cores, componentes com estados, layout, motion, icons
- HTML auto-suficiente: funciona no iframe do app E no arquivo baixado
- Zero dependências externas

---

## O que NÃO muda

- Upload modal (`ds-upload-modal.tsx`) — sem alterações
- Viewer drawer (`ds-viewer-drawer.tsx`) — sem alterações
- Schema do banco — sem alterações
- Fluxo de autenticação — sem alterações
