# PRD — Garden Shop V2

**Status:** implementação local disponível; validação visual e de interações pendente.  
**Atualização:** 25/10/2026.  
**Referência técnica:** SPEC.md; requisitos identificados como R01–R15.

## Problema e usuários

**Fato do contexto:** a loja virtual de jardinagem tem dificuldade para localizar produtos que precisam de atenção, avaliar o saldo em relação às vendas e priorizar o acompanhamento e a reposição.

**Fatos da base:** 24 produtos, 6 abaixo do nível cadastrado e 1 zerado; um dos produtos abaixo do nível está descontinuado. O histórico fornecido contém pedidos de janeiro a junho de 2024. A data do saldo não foi informada.

Usuários propostos: responsável pela operação (revisar alertas), compras (identificar produtos e fornecedores), gestão (comparar estoque, vendas e clientes). Os papéis são uma proposta de uso, não um cadastro de usuários existente no software.

## Objetivos

- Localizar produtos zerados e abaixo do nível, distinguindo descontinuados.
- Apoiar a triagem de reposição com saldo, parâmetro cadastrado, fornecedor e vendas registradas.
- Mostrar evolução de unidades, valor dos itens e pedidos enviados, sem duplicar pedidos por item.
- Apresentar composição das vendas por categoria e principais clientes do recorte.

Reduzir rupturas e melhorar capital empregado são benefícios esperados, ainda não demonstrados. O ranking de clientes complementa a análise comercial, sem comprovar necessidade futura de reposição.

## Escopo e exclusões

**Incluído:** aplicação estática local em HTML/CSS/JavaScript; dados incorporados; três áreas; filtros; gráficos SVG; ranking; detalhe de produto; exportação CSV; importador Python e testes Node.js.

**Excluído:** publicação nesta entrega, login, banco de dados, atualização automática, gravação de ações, emissão de compras, previsão de demanda, estoque histórico, reserva líquida, cobertura, estoque de segurança e quantidade ótima de compra. Não há receita líquida ou lucro histórico calculados.

## Organização final implementada

A V2 abre em **Vendas e clientes**. A área **Visão geral** contém estoque e fila; **Critérios e dados** explica regras e limites. A recomendação de futuramente abrir em estoque é uma melhoria a decidir, não o comportamento final atual.

## Requisitos e critérios de aceitação

### R01 — Navegação e contexto

Exibir as três áreas, informação de base histórica e aviso de que a data do saldo não foi informada. Ao trocar de área, preservar os filtros. Abrir inicialmente Vendas e clientes. A fila de estoque aparece somente em Visão geral.

**Utilidade:** separa análise comercial de revisão operacional e evita interpretar o histórico como informação atual.

**Aceite observável:** troca de área exibe seu conteúdo; os controles selecionados permanecem; o aviso do saldo continua visível.

### R02 — Alertas e elegibilidade

Exibir estoque zero, abaixo do nível e elegíveis para avaliação de reposição. Igualdade é estado separado. Elegível significa abaixo do nível e não descontinuado. Alertas zero e abaixo podem se sobrepor.

**Utilidade:** localiza exceções sem transformar descontinuação em compra automática.

**Aceite:** base original: 1 zerado, 6 abaixo e 5 elegíveis. Bird Feeder aparece como descontinuado e não integra os 5 elegíveis.

### R03 — Valor de estoque e tabela

Calcular valor estimado ao custo cadastrado; mostrar produto, categoria, fornecedor, saldo, nível, diferença, unidades enviadas, pendentes, processando e motivo/ação. Permitir ordenação por nome, saldo ou unidades enviadas.

**Utilidade:** oferece os dados necessários à revisão de cada item e dimensiona o saldo em valor.

**Aceite:** total original USD 4.763,00; 24 produtos; diferença de Hanging Basket igual a 10. O rótulo não pode chamar a diferença de quantidade recomendada de compra.

### R04 — Priorização proposta

Ordenar inicialmente não descontinuados zerados, abaixo do nível, demais e descontinuados. Desempatar por unidades enviadas decrescentes, razão saldo/nível crescente e ID. Permitir substituir a ordem por ordenação manual. Limpar filtros restaura a ordem inicial.

**Utilidade:** torna a triagem explicável. A regra é proposta para validação, não urgência econômica comprovada.

**Aceite:** Hanging Basket precede os produtos não zerados; motivos e condição de descontinuação são visíveis.

### R05 — Filtros e seus alcances

Compartilhados: categoria, fornecedor, catálogo (todos/não descontinuados/descontinuados) e intervalo de pedidos. Apenas estoque: busca por nome e situação. Apenas vendas: produto, agrupamento, medida e ordenação de clientes. Datas não alteram o saldo. Intervalo invertido deve apresentar validação e não gerar nova renderização com a seleção inválida.

**Utilidade:** permite investigar sem misturar saldo e histórico. O recorte de vendas é explicitado em texto.

**Aceite:** período sem pedidos zera vendas, mas preserva o estoque; situação e busca da fila não mudam os gráficos de vendas. Limpar filtros restaura 15/01/2024–14/06/2024, todos os catálogos, agrupamento mensal, unidades e ranking por valor.

### R06 — Vendas e pedidos no tempo

Mostrar uma linha de unidades ou valor dos itens e outra de pedidos distintos, em dia, semana ou mês. Produto específico ou todos. Oferecer tabela com os mesmos dados e valores dos pontos via mouse/teclado.

**Utilidade:** distingue volume de unidades, valor monetário e frequência de pedidos. O agrupamento mensal inicial reduz a fragmentação de uma amostra pequena.

**Aceite:** mesmo total ao alternar agrupamentos: 65 unidades e 17 pedidos enviados; fevereiro de 2024: 9 unidades, USD 141,50 e 3 pedidos. Datas filtram pela data do pedido, não pela data de envio.

### R07 — Categorias e ranking de produtos

Mostrar pizza por unidades ou valor, com legenda, valores e percentuais; selecionar a legenda filtra a categoria. Mostrar até 10 produtos com maior volume enviado e abrir detalhe ao selecioná-los.

**Utilidade:** identifica composição e produtos mais vendidos. Pizza favorece leitura de participação; barras seriam alternativa futura para comparação mais precisa entre participações próximas.

**Aceite:** participações somam aproximadamente 100% (arredondamento de apresentação); quantidades por categoria somam 65 no recorte completo. Terracotta Pot 8in lidera unidades enviadas com 9.

### R08 — Clientes

Mostrar até 10 clientes por valor dos itens, pedidos distintos ou unidades. Incluir nome e ID, sem contato pessoal. Exportar todos os clientes compradores do recorte, não apenas os 10 exibidos.

**Utilidade:** permite reconhecer concentração e principais compradores no histórico; não prova fidelidade ou valor futuro.

**Aceite:** 14 clientes compradores no total; no ranking por valor, Sofia Greer tem USD 132,00, 2 pedidos e 9 unidades. Ao filtrar catálogo, valores referem-se somente aos itens correspondentes.

### R09 — Status, preços e contagens

Incluir apenas shipped nas vendas e no ranking; excluir cancelled, pending e processing dessas métricas. Exibir pending e processing separadamente na fila sem deduzir do saldo. Usar preço unitário do item, não preço atual do catálogo. Contar cada pedido uma vez no recorte.

**Utilidade:** evita inflar vendas ou pedidos e preserva o preço da transação. A equivalência entre shipped e venda realizada é uma convenção inicial a confirmar com a operação.

**Aceite:** acrescentar itens a um mesmo pedido não aumenta a contagem de pedidos; alterar quantidades de cancelados não altera vendas.

### R10 — Descontinuados no histórico

Incluir descontinuados em vendas históricas e no valor de estoque, salvo filtro explícito; excluí-los somente da elegibilidade de reposição.

**Utilidade:** preserva histórico sem sugerir compra de produto fora do catálogo.

**Aceite:** selecionar não descontinuados remove seus itens e saldos do recorte; sem esse filtro, permanecem incluídos.

### R11 — Estados sem dados

Busca sem produto correspondente: tabela de estoque informa que nenhum produto foi encontrado. Sem vendas no recorte: cartões de vendas com zero, pizza e ranking com mensagem e série temporal com zeros quando existe intervalo válido. Sem intervalo e sem pedidos na base: série vazia, sem inventar datas. Nenhum cálculo deve dividir por zero na pizza.

**Utilidade:** distingue resultado vazio de demanda inexistente e evita gráficos inválidos.

**Aceite:** janeiro–março de 2025 gera três períodos mensais zerados na base original; ranking e pizza não apresentam participantes fictícios.

### R12 — Detalhe e exportações

Abrir detalhe com saldo, nível, unidades enviadas, fornecedor, valor do estoque e histórico mensal do produto. Exportar seleção de produtos e ranking completo de clientes em CSV com cabeçalho e escape de conteúdo.

**Utilidade:** permite investigar e compartilhar a lista de revisão. O detalhe mensal original usa barras, enquanto os gráficos principais da V2 usam linhas.

**Aceite:** o CSV reflete a seleção e distingue unidades, pedidos e valores; o detalhe exibe o produto selecionado. O produto selecionado nos controles analíticos não altera a exportação de estoque.

### R13 — Carga e proteção dos dados

Validar CSVs antes de gerar data.js. Não incluir e-mail, telefone ou endereço de clientes; nomes são necessários ao ranking. Manter explícito que a aplicação estática não possui autenticação e que os dados incorporados podem ser lidos por quem receber os arquivos.

**Aceite:** importação de chaves duplicadas ou referência ausente falha antes da escrita; base gerada contém somente ID e nome dos clientes. Erros globais de carregamento na interface ainda são limitação, conforme SPEC S09.

### R14 — Reconciliação e qualidade

Manter controles automatizados de estoque e análise comercial. Não somar saldo após multiplicá-lo por linhas de itens. Indicar valor parcial quando o modelo de estoque recebe saldo ou custo inválido; o fluxo normal bloqueia esses dados na carga.

**Aceite:** controles de base e casos sintéticos de S10 passam. Sintaxe válida não substitui validação visual.

### R15 — Limitações visíveis

Informar base histórica, data do saldo desconhecida e ausência de dados para receita líquida, compras em trânsito, reservas, previsão, validade e perdas. Períodos extremos podem ser parciais. Zero vendas não comprova falta de demanda; zero estoque não comprova perda de vendas.

**Aceite:** seção Critérios e dados e textos próximos aos gráficos explicam esses limites; nenhuma medida é rotulada como receita líquida ou compra ótima.

## Verificação e conclusão de entrega

**Verificado:** testes de estoque e análises, checagens de sintaxe e importação dos arquivos originais. **Pendente:** aceites visuais e de interação no navegador, CSV aberto em aplicativo de planilha, responsividade, acessibilidade e compatibilidade entre navegadores. Os comportamentos de interface acima descrevem o código, não uma homologação visual já concluída.

## Limitações e hipóteses de negócio

Pedidos de apenas parte de 2024 não sustentam previsão atual ou sazonalidade anual. Sem saldo histórico, não se distingue baixa procura de vendas limitadas por falta de estoque. Sem prazos, compras abertas e estoque-alvo, não há quantidade segura de compra. O custo atual não comprova margem histórica. Categorias e fornecedores refletem o cadastro fornecido, sem histórico de alteração.

Sazonalidade, fidelidade, perdas por conservação e demanda reprimida são hipóteses para investigação. Redução de ruptura e tempo de triagem não foram medidos. Metas de adoção e desempenho devem ser pactuadas após medir uma linha de base.
