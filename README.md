# Garden Shop — Dashboard de Estoque e Vendas

Dashboard web interativo para apoiar a gestão de estoque de uma loja virtual de jardinagem. A versão 2 reúne alertas de reposição, evolução das vendas e dos pedidos, participação das categorias e ranking de clientes.

Desenvolvido em **HTML, CSS e JavaScript**, com gráficos em SVG e processamento no navegador. Não exige framework, instalação de pacotes ou conexão com serviços externos para executar a aplicação.

> **Contexto dos dados:** esta versão utiliza uma base histórica com pedidos de 15/01/2024 a 14/06/2024. A data de referência do saldo de estoque não foi informada. Os resultados não representam necessariamente a operação atual.

## Objetivo

Permitir que operação, compras e gestão identifiquem produtos que precisam de atenção e consultem o histórico de vendas para contextualizar decisões de reposição.

O dashboard ajuda a responder:

- Quais produtos estão zerados ou abaixo do nível cadastrado?
- Quais produtos não descontinuados precisam de avaliação de reposição?
- Quais categorias e fornecedores estão associados aos alertas?
- Qual é o valor estimado do estoque ao custo cadastrado?
- Como unidades vendidas, valor dos itens e pedidos variam ao longo do tempo?
- Quais categorias e clientes concentram as vendas do período?

## Funcionalidades

### Estoque e reposição

- Indicadores de estoque zero, abaixo do nível, elegíveis para avaliação de reposição e valor do estoque.
- Comparações por categoria e fornecedor.
- Tabela de acompanhamento com saldo, nível, diferença até o nível, unidades enviadas, pedidos em aberto e motivo da prioridade.
- Busca, filtros, ordenação, detalhe do produto e exportação CSV.

### Vendas e clientes

- Gráfico de linhas de vendas, alternando entre unidades e valor dos itens em USD.
- Gráfico de linhas com pedidos enviados distintos.
- Agrupamentos por dia, semana ou mês e seleção de produto.
- Gráfico de pizza com participação das categorias por unidades ou valor.
- Ranking dos 10 principais clientes, ordenável por valor, pedidos ou unidades.
- Exportação de todos os clientes compradores do recorte e tabela dos dados temporais.

### Critérios e dados

- Definições das medidas e das regras de negócio.
- Explicação dos filtros, limitações e hipóteses de interpretação.

A versão 2 abre em **Vendas e clientes**. Utilize o menu lateral para acessar **Visão geral**, com os indicadores de estoque, ou **Critérios e dados**.

## Tecnologias

| Tecnologia | Uso |
|---|---|
| HTML5 | Estrutura e conteúdo |
| CSS3 | Layout responsivo e apresentação |
| JavaScript | Filtros, cálculos, tabelas e interações |
| SVG | Gráficos de linhas, barras e pizza |
| Python, biblioteca padrão | Validação dos CSVs e geração de `data.js` |
| Node.js, biblioteca padrão | Testes automatizados dos modelos e checagem de sintaxe |

Não há backend, banco de dados, autenticação ou atualização automática.

## Como executar

1. Baixe o repositório ou faça seu clone.
2. Localize a pasta que contém `index.html` e os scripts da aplicação.
3. Abra `index.html` no navegador, mantendo os arquivos na mesma pasta.

No Windows, também é possível executar `abrir.cmd`.

**Não é necessário instalar Python ou Node.js para usar o dashboard.** Esses runtimes são utilizados somente para atualização dos dados e verificações de desenvolvimento.

Caso mantenha a estrutura de entrega original, os arquivos da aplicação estarão em `garden-shop-v2/`. Se publicar seu conteúdo diretamente na raiz do repositório, os comandos abaixo devem ser executados nessa raiz.

## Estrutura do projeto

```text
.
├── index.html               # Página principal e controles
├── styles.css               # Estilos e layout responsivo
├── app.js                   # Interface de estoque e filtros compartilhados
├── model.js                 # Regras e cálculos de estoque
├── analytics.js             # Gráficos, ranking e interações comerciais
├── analytics-model.js       # Agregações de vendas, pedidos e clientes
├── data.js                  # Base incorporada, gerada pelo importador
├── atualizar_dados.py        # Leitura e validação dos seis CSVs
├── abrir.cmd                # Abertura local no Windows
├── test.cjs                 # Testes do modelo de estoque
├── test-analytics.cjs        # Testes do modelo comercial
├── AGENTS.md                # Instruções para agentes no repositório
├── PRD.md                   # Requisitos e critérios de aceitação
├── SPEC.md                  # Especificação técnica e rastreabilidade
└── README.md
```

## Dados utilizados

O projeto utiliza seis arquivos relacionados:

| Arquivo | Conteúdo |
|---|---|
| `products.csv` | Produtos, saldos, níveis, custos e descontinuação |
| `categories.csv` | Categorias dos produtos |
| `suppliers.csv` | Fornecedores |
| `orders.csv` | Pedidos, clientes, datas e status |
| `order_items.csv` | Produtos, quantidades e preços registrados nos pedidos |
| `customers.csv` | Cadastro utilizado para identificar os compradores |

O código espera arquivos UTF-8, separados por vírgula, com os nomes e campos definidos em [SPEC.md](SPEC.md). Os CSVs originais não são necessários para abrir a base já incorporada em `data.js`.

### Atualizar a base

Com Python instalado, execute na pasta da aplicação:

```bash
python atualizar_dados.py "CAMINHO_DA_PASTA_DOS_CSVS"
```

O importador verifica campos obrigatórios, chaves, referências, números, datas e status antes de substituir `data.js`. Faça uma cópia da base incorporada antes de uma atualização que precise ser reversível.

Depois de uma carga bem-sucedida, recarregue a página e ajuste o período dos pedidos. **As datas iniciais dos controles permanecem fixadas no intervalo original; não são atualizadas automaticamente pelo importador.**

A data de execução da carga não deve ser interpretada como data do saldo de estoque.

## Regras de negócio

### Estoque

- **Estoque zero:** saldo igual a zero.
- **Abaixo do nível:** saldo menor que `reorder_level`.
- **Elegível para avaliação de reposição:** abaixo do nível e não descontinuado.
- **Diferença até o nível:** `máximo(nível − saldo, 0)`.
- **Valor estimado do estoque:** soma de `saldo × custo cadastrado`, em USD.

Produtos descontinuados permanecem no valor do estoque e nas análises históricas, salvo filtro explícito. Eles ficam fora da fila proposta de reposição e recebem a indicação de revisão do catálogo.

Os indicadores de estoque zero e abaixo do nível podem incluir o mesmo produto e não devem ser somados.

A prioridade proposta apresenta primeiro produtos não descontinuados zerados, depois os abaixo do nível, os demais e, por último, os descontinuados. Os desempates consideram unidades enviadas, razão saldo/nível e identificador. Essa é uma regra de triagem, não uma previsão de urgência econômica.

### Vendas e pedidos

- Somente pedidos `shipped` compõem as vendas e o ranking de clientes.
- Pedidos `cancelled` são excluídos dessas métricas.
- `pending` e `processing` aparecem separadamente no acompanhamento operacional e não são deduzidos do estoque.
- **Valor dos itens:** soma de `quantity × unit_price`, usando o preço registrado na transação.
- **Pedidos:** contagem distinta de `order_id`, sem duplicação por linha de item.
- Datas filtram `order_date`, incluindo início e fim.
- Semanas começam na segunda-feira; intervalos vazios da série principal são preenchidos com zero.

O valor dos itens não representa receita líquida: descontos, frete, impostos e devoluções não estão quantificados. Com filtro de categoria ou produto, o valor considera apenas os itens correspondentes, e o pedido conta quando contém pelo menos um desses itens.

### Alcance dos filtros

Categoria, fornecedor, catálogo e período são compartilhados. O período modifica os pedidos analisados, **sem reconstruir o saldo de estoque no passado**.

A busca e a situação da fila de estoque não alteram os gráficos comerciais. O produto selecionado na área de vendas não modifica a tabela de estoque. Os rótulos e o resumo dos filtros devem ser consultados para interpretar cada recorte.

## Testes e verificações

Execute na pasta da aplicação, com Node.js disponível:

```bash
node test.cjs
node test-analytics.cjs
```

Para checar a sintaxe dos módulos de interface:

```bash
node --check app.js
node --check analytics.js
node --check analytics-model.js
```

Os testes cobrem totais de estoque, contagem distinta de pedidos, cancelamentos, descontinuados, preços da transação, filtros, datas inclusivas, períodos vazios e reconciliações entre agregações.

### Controles da base original

| Indicador | Resultado |
|---|---:|
| Produtos | 24 |
| Unidades em estoque | 937 |
| Produtos abaixo do nível | 6 |
| Elegíveis para avaliação de reposição | 5 |
| Produtos com estoque zero | 1 |
| Valor estimado do estoque | USD 4.763,00 |
| Pedidos enviados distintos | 17 |
| Unidades enviadas | 65 |
| Valor dos itens enviados | USD 885,50 |
| Clientes compradores | 14 |

Nem todos esses números possuem um `assert` individual. A cobertura exata e os exemplos estão descritos em [SPEC.md](SPEC.md).

**Ambiente utilizado na verificação:** Node.js v24.22.1 e Python 3.12.14. Essas versões foram utilizadas nos testes, mas não constituem versões mínimas certificadas. Os scripts foram executados com os caminhos absolutos dos runtimes; a disponibilidade dos comandos curtos no PATH depende do ambiente local.

**Estado da validação:** testes dos modelos, checagens de sintaxe e importação da base original concluídos com sucesso. A revisão visual, as interações, a responsividade, a acessibilidade e a compatibilidade entre navegadores permanecem pendentes de homologação. Não há suíte automatizada de testes de navegador.

## Limitações

- A data de referência do saldo não foi fornecida.
- O histórico de pedidos cobre apenas parte de 2024 e não comprova sazonalidade anual ou demanda atual.
- Não há movimentações de estoque, reservas, compras em trânsito, prazos de entrega, devoluções, lotes, validade ou perdas.
- A diferença até o nível não determina uma quantidade recomendada de compra.
- Zero vendas não comprova ausência de demanda; estoque zero não comprova venda perdida.
- O ranking identifica os principais compradores do recorte, sem demonstrar fidelidade, rentabilidade ou valor futuro.
- A interface não possui recuperação global para `data.js` ausente ou corrompido.
- Existem restrições de formato e normalização dos dados e de extensão das séries temporais, documentadas em [SPEC.md](SPEC.md), seção S09.

## Cuidados antes de publicar no GitHub

`data.js` contém os dados incorporados, incluindo identificador e nome dos clientes. Quem tiver acesso ao repositório ou aos arquivos poderá lê-los.

Antes de tornar o repositório público, confirme a autorização para distribuir a base ou substitua os dados por uma versão sintética ou anonimizada. Não inclua os CSVs originais, dados de contato, credenciais ou arquivos com caminhos pessoais por conveniência de desenvolvimento.

O projeto não implementa controle de acesso. Uma eventual publicação web deve considerar a audiência e a sensibilidade dos dados.

## Documentação

- [PRD.md](PRD.md): problema, usuários, escopo, requisitos R01–R15 e critérios de aceitação.
- [SPEC.md](SPEC.md): contratos, fórmulas, agregações, filtros, módulos, exemplos e limites conhecidos.
- [AGENTS.md](AGENTS.md): preparação do ambiente, comandos verificados, fluxo de revisão e cuidados com dados.

Ao alterar uma regra, atualize o requisito correspondente, a especificação e os testes afetados. Preserve a distinção entre comportamento implementado, melhoria proposta e verificação pendente.

## Possíveis evoluções

As iniciativas abaixo são propostas e **não estão implementadas**:

- Integração com uma fonte atualizada do sistema de gestão.
- Histórico de saldos e acompanhamento da duração de indisponibilidades.
- Compras em trânsito, prazo de fornecedores e parâmetros para avaliar reposição.
- Registro de responsável, ação e prazo de acompanhamento.
- Homologação visual e ampliação dos testes de interface e acessibilidade.

## Licença

Este projeto ainda não inclui um arquivo de licença. Defina os termos de uso e distribuição antes de autorizar a reutilização por terceiros.
