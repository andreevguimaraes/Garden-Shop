# SPEC — Garden Shop V2

**Atualização:** 25/10/2026. **Tipo:** especificação da implementação local existente.  
**Produto:** PRD.md, requisitos R01–R15. **Operação do agente:** AGENTS.md.

## S01 — Arquitetura, entradas e saídas

**Atende:** R01, R12, R13, R14.

Aplicação estática, sem build e sem API. `index.html` carrega, nesta ordem: `data.js`, `model.js`, `analytics-model.js`, `app.js`, `analytics.js`. Os scripts compartilham o escopo clássico do navegador. `app.js` consulta o gancho `window.renderAnalytics` quando disponível; `analytics.js` registra o gancho e executa a primeira renderização analítica.

Entrada de preparação: seis CSVs UTF-8, com separador vírgula; BOM aceito (`utf-8-sig`), cabeçalhos exatos e valores textuais. `atualizar_dados.py` usa bibliotecas padrão e escreve `data.js` somente depois das validações. A interface não lê CSVs diretamente.

Entrada de execução: `window.GARDEN_DATA`, com arrays products, categories, suppliers, orders, order_items e customers. Datas do pedido são strings ISO. Números são convertidos nos modelos; IDs permanecem strings.

Saídas: DOM e gráficos SVG no navegador; arquivo CSV de produtos selecionados; arquivo CSV de todos os clientes compradores selecionados. Não há escrita no sistema de gestão nem persistência de filtros ou ações.

Arquivo HTML independente e ZIP são derivados de distribuição. O HTML independente incorpora uma cópia dos scripts e dados; atualizar a pasta não o atualiza automaticamente. Não existe script versionado de geração desse HTML.

## S02 — Tabelas, campos e chaves

**Atende:** R02, R03, R08–R10, R13, R14.

| Arquivo / array | Granularidade e PK | Campos obrigatórios na importação |
|---|---|---|
| products.csv / products | Um produto; product_id | product_id, product_name, category_id, supplier_id, quantity_on_hand, reorder_level, cost, price, discontinued |
| categories.csv / categories | Uma categoria; category_id | category_id, category_name |
| suppliers.csv / suppliers | Um fornecedor; supplier_id | supplier_id, supplier_name |
| orders.csv / orders | Um pedido; order_id | order_id, customer_id, order_date, status |
| order_items.csv / order_items | Um item; order_item_id | order_item_id, order_id, product_id, quantity, unit_price |
| customers.csv / customers | Um cliente; customer_id | customer_id, first_name, last_name |

### Tipos e domínios

- IDs: texto não vazio e único na PK; não pressupor igualdade de nomes nem usá-los em joins.
- product_name, category_name, supplier_name, first_name, last_name: texto. Presença do cabeçalho é validada; conteúdo vazio desses nomes não é bloqueado atualmente.
- quantity_on_hand, reorder_level: inteiros não negativos; unidades físicas.
- quantity: inteiro positivo.
- price, cost, unit_price: números finitos não negativos, em USD, com ponto decimal no CSV.
- discontinued: texto true/false; o importador aceita maiúsculas ou minúsculas, mas não normaliza sua representação. Ver ressalva S09.
- order_date: data aceita por `datetime.date.fromisoformat`; a interface pressupõe o formato canônico AAAA-MM-DD. O CSV original usa esse formato, apesar da divergência do dicionário, que descreve datas de pedidos como DD/MM/AAAA.
- status: shipped, pending, processing ou cancelled, exatamente em minúsculas.

### Relações verificadas pelo importador

- products.category_id → categories.category_id (N:1).
- products.supplier_id → suppliers.supplier_id (N:1).
- orders.customer_id → customers.customer_id (N:1).
- order_items.order_id → orders.order_id (N:1).
- order_items.product_id → products.product_id (N:1).

Cada relação deve encontrar uma PK correspondente. `order_item_id` é a chave do item; não há restrição de unicidade para o par order_id/product_id. O mesmo produto em duas linhas legítimas de um pedido soma quantidades e valor, mas não soma dois pedidos.

Um pedido sem itens não é bloqueado pela carga atual e não aparece nas contagens analíticas de pedidos, que partem de itens correspondentes. Essa condição precisa ser revisada se surgir em nova base.

### Campos efetivamente preservados

O importador reduz suppliers a ID e nome; orders a order_id, customer_id, order_date e status; customers a ID, primeiro nome e sobrenome. Não incorpora contatos ou endereços de clientes. Products, categories e order_items preservam eventuais colunas extras do arquivo: revisar antes de distribuir uma nova base. quantity_on_hand não tem data de referência fornecida.

## S03 — Estoque, fórmulas e prioridade

**Atende:** R02–R04, R10, R14.

`model.analyze(data, filters)` retorna uma linha por produto; `summarize(rows)` consolida o recorte.

| Campo calculado | Regra |
|---|---|
| stock / level / cost | Conversão Number de quantity_on_hand / reorder_level / cost |
| valid | Saldo e nível diferentes de string vazia, finitos e não negativos |
| costValid (interno) | Custo diferente de string vazia, finito e não negativo |
| discontinued | Campo convertido a minúsculas e comparado a true |
| below | valid e stock < level |
| eligible | below e não discontinued |
| gap | valid ? máximo(level − stock, 0) : null |
| value | valid e costValid ? stock × cost : null |
| status | invalid se !valid; depois zero se stock = 0; low se stock < level; equal se stock = level; senão ok |

O indicador below é independente do rótulo exclusivo status. Assim, saldo 0 e nível 10 é status zero e também below; saldo 0 e nível 0 é zero, mas não below nem eligible.

`summarize`: count = número de linhas; zero = contagem status zero; below/eligible = contagem dos respectivos booleanos; value = soma de valores não nulos; incomplete = existe value nulo; units = soma de stock apenas válido; shipped = soma das unidades enviadas por produto.

Um valor nulo é excluído da soma e o cartão informa parcial. Conjunto vazio resulta em totais zero e incomplete false. O importador é mais estrito do que o modelo: exige inteiros para saldo/nível e bloqueia ausências, enquanto o modelo não testa integralidade.

### Agregação de itens por produto

Antes de combinar vendas com estoque, criar Map por order_id e agregar order_items por product_id. Cada item soma quantity somente em shipped, pending ou processing, respeitando o período. Cancelled não entra em nenhum desses três acumuladores. Produtos sem itens recebem zeros. Esse fluxo preserva o catálogo e impede multiplicar saldo/custo por quantidade de linhas de vendas.

### Prioridade

Ordem padrão de `analyze`:

1. discontinued: prioridade 3; caso contrário, stock = 0: prioridade 0; below: prioridade 1; demais: prioridade 2.
2. Empate: shipped decrescente.
3. Empate: stock/level crescente; nível zero usa Infinity.
4. Empate: ID convertido a número, crescente (base fornecida tem IDs numéricos).

Prioridade é triagem proposta, não previsão de urgência. Registros inválidos não possuem fila especial confiável; devem ser corrigidos na carga. A interface permite ordenação manual por nome, saldo ou unidades, substituindo a prioridade até limpar filtros.

## S04 — Vendas, pedidos, categorias e clientes

**Atende:** R06–R10, R14.

`GardenAnalytics.analytics(data, filters)`:

1. Selecionar produtos pelos filtros de categoria, fornecedor, produto analítico e descontinuação.
2. Selecionar pedidos shipped no intervalo inclusivo de order_date.
3. Percorrer itens cujo produto e pedido pertencem às seleções.
4. Acumular valores, unidades e conjuntos de IDs. Nenhuma dedução de pedidos abertos é feita sobre estoque.

### Fórmulas

- unidades = Σ quantity dos itens selecionados.
- valor de cada item em centavos = round(Number(unit_price) × 100) × quantity.
- valor dos itens = Σ centavos / 100.
- pedidos = tamanho do Set global de order_id com itens selecionados.
- clientes compradores = quantidade de customer_id com itens selecionados.
- categorias: Σ unidades e centavos por category_id.
- participação = medida da categoria / soma da medida de todas as categorias selecionadas × 100.
- clientes: Σ unidades, Σ centavos / 100 e tamanho do Set de order_id por customer_id.

O cálculo monetário analítico arredonda o preço unitário a centavos antes de multiplicar pela quantidade. O importador não bloqueia preços com mais de duas casas: sua aceitação produzirá esse arredondamento. O valor do estoque, por outro lado, usa multiplicação Number e formatação monetária na interface; não compartilha uma rotina contábil decimal.

Preços são os da transação (`unit_price`); não usar products.price. Não descontar coupon_code: não há valor ou regra de desconto fornecidos. Não chamar o total de receita líquida ou lucro.

Um pedido com produtos em duas categorias conta uma vez globalmente. Contagens de pedidos em recortes de categorias não são aditivas. Com filtro de catálogo, valor e unidades de um cliente se referem aos itens correspondentes, não ao valor integral dos pedidos.

### Ranking

`analytics.js` ordena clientes pela medida escolhida (value, orders ou units), decrescente; empate por nome via localeCompare. A tabela mostra 10 e a exportação usa a lista inteira. ID e nome identificam a pessoa; homônimos não são consolidados. Nome não encontrado recebe Cliente + ID como fallback do modelo; carga normal rejeita FK sem correspondência.

Descontinuados entram no histórico por padrão. Excluí-los explicitamente do catálogo remove seus itens do recorte, sem apagar registros da fonte.

## S05 — Séries temporais e apresentações

**Atende:** R06, R07, R11, R12, R15.

Sem filtro de datas, o modelo usa menor/maior order_date de todos os pedidos da base, inclusive status não enviados. Na interface, o padrão está fixado em 2024-01-15 a 2024-06-14. Não ajusta automaticamente o padrão quando se troca a base.

`bucket(date, grain)` usa UTC para evitar mudança de dia por fuso:

- day: próprio dia.
- week: segunda-feira da semana.
- month: primeiro dia do mês.

Gerar os buckets do início ao fim e inicializá-los com zero; depois acumular itens e Sets de pedidos. O filtro é aplicado antes do bucket, portanto bordas podem ser parciais. Rótulo inicial do mês/semana pode anteceder a primeira data filtrada. O laço tem limite defensivo de 40.000 buckets; intervalos maiores não são suportados de forma confiável (S09).

### Renderização

- Linhas SVG: vendas em units ou value e pedidos em orders, separadamente; pontos com title e foco de teclado; escala parte de zero.
- A escala vertical de pedidos pode apresentar marcas fracionárias, embora os dados de pedidos sejam inteiros.
- Tabela temporal: todas as linhas da série, não apenas rótulos visíveis no eixo.
- Pizza SVG: categorias ordenadas pela medida decrescente, cores fixas, legenda com valor e percentual; uma única categoria usa círculo completo. Total zero apresenta mensagem em vez de divisão por zero. Percentuais exibidos podem divergir de 100% na soma por arredondamento.
- Ranking de produtos: até 10 com shipped > 0, ordenados por shipped e ID; barras abrem detalhe.
- Detalhe de produto: barras mensais, não linhas. Inicializa meses presentes nos pedidos do recorte, sem preencher meses totalmente ausentes da base; essa diferença em relação às séries principais é comportamento atual.
- Categoria de estoque: barras com below > 0; tooltip mostra contagem, total e percentual no recorte.
- Fornecedor: barras com eligible > 0.

## S06 — Matriz dos filtros e controles

**Atende:** R01, R05, R06–R08, R12.

| Controle | Estoque e cartões operacionais | Vendas, pizza, clientes e cartões comerciais |
|---|---|---|
| Categoria / fornecedor | Filtra produtos | Filtra produtos e itens |
| Catálogo / discontinued | Filtra produtos | Filtra produtos e histórico |
| Início / fim | Filtra shipped/pending/processing; não muda stock ou value | Filtra order_date |
| Busca de produto da fila | Filtra nomes por substring sem diferenciar maiúsculas | Não se aplica |
| Situação de estoque | Filtra linhas e cartões de estoque | Não se aplica |
| Produto analítico | Não se aplica | Filtra produto específico |
| Dia / semana / mês | Não se aplica | Modifica buckets, não o total |
| Unidades / valor | Não se aplica | Modifica linha de vendas e pizza |
| Ordenação de clientes | Não se aplica | Modifica ranking e ordem exportada |

O detalhe usa o produto da linha selecionada e intervalo compartilhado, não o produto do seletor analítico. Os cartões de estoque refletem a situação selecionada e podem se sobrepor. Selecionar novamente um cartão/legenda de categoria/fornecedor equivalente remove o respectivo filtro. A lista de opções não se restringe automaticamente aos produtos da categoria selecionada; combinações sem correspondência são permitidas e geram estado vazio.

Limpar filtros redefine categoria, fornecedor, catálogo, busca e situação para todos; datas para intervalo original; produto analítico para todos; grain month; salesMetric units; customerMetric value; remove ordenação manual. Não altera a página ativa.

## S07 — Responsabilidade dos módulos

**Atende:** R01–R15.

| Módulo | Responsabilidade | Evitar |
|---|---|---|
| atualizar_dados.py | Validar contrato, referências e domínios; minimizar dados; escrever data.js | Tratar erro como zero, editar fonte ou importar contatos |
| data.js | Disponibilizar dados, sem lógica de negócio | Segredos e alegação de atualização automática |
| model.js | Fórmulas e prioridade de estoque; agregação por status | Duplicar produto por item |
| analytics-model.js | Filtros comerciais, centavos, Sets, períodos e agregações | Usar preço atual ou somar contagens de pedidos por categoria |
| app.js | Controles compartilhados, navegação, tabela, detalhe e CSV de estoque | Misturar período de pedidos com histórico de saldo |
| analytics.js | Controles comerciais, SVG, ranking, CSV de clientes | Deduzir regras pelos textos dos gráficos |
| index.html / styles.css | Estrutura, textos, apresentação e responsividade | Declarar como entregue funcionalidade sem código |
| test.cjs / test-analytics.cjs | Regressão e exemplos sintéticos | Atualizar esperado sem reconciliação |

## S08 — Exportações e segurança de apresentação

**Atende:** R08, R12, R13.

CSV de produtos: Produto, Categoria, Fornecedor, Saldo, Nivel, Diferenca ate nivel, Unidades enviadas, Pendentes, Processando, Descontinuado, Valor USD. Usa as linhas de estoque após filtros e ordenação; não depende do produto analítico.

CSV de clientes: Cliente ID, Nome, Valor itens USD, Pedidos distintos, Unidades. Inclui todos os compradores do recorte, mesmo que a tela mostre somente 10.

Ambos: UTF-8 com BOM, ponto e vírgula, cabeçalhos, aspas em todas as células, duplicação de aspas internas e CRLF. Valores numéricos são serializados com representação JavaScript; formatação pt-BR é da tela, não uma garantia de conversão automática em todo Excel. Prefixos =, +, @ e - são neutralizados com apóstrofo no início do conteúdo. Não há proteção geral contra todo formato de fórmula com espaços/controladores anteriores; não tratar CSV como barreira de segurança completa para dados arbitrários.

Textos interpolados em HTML passam por esc(); seletores e classes de situação são gerados pelo código. Nenhum segredo ou controle de acesso é implementado. Distribuição dos arquivos distribui também os nomes dos clientes.

## S09 — Erros, ausências e limites conhecidos

**Atende:** R05, R11, R13–R15. Esta seção distingue tratamento implementado de melhorias pendentes.

| Situação | Comportamento atual |
|---|---|
| Arquivo/argumento ausente no importador | Exceção Python e saída não bem-sucedida; sem interface de upload |
| Cabeçalhos faltantes, PK vazia/duplicada, FK inexistente | ValueError antes de escrever data.js |
| Número vazio, não numérico, infinito, negativo; quantidade não inteira | Exceção antes da escrita; não imputar zero |
| Data inválida, status fora do domínio, booleano não reconhecido | Exceção antes da escrita |
| Erro de escrita | Exceção; gravação não é transacional nem possui rollback automático |
| Nome vazio | Não bloqueado hoje; cabeçalho apenas é obrigatório |
| Campo numérico whitespace-only | Importador falha; não há normalização automática |
| Estoque/custo vazio string em chamada direta ao modelo | status invalid e/ou value null, valor parcial sinalizado |
| null ou payload fora do contrato no modelo | Sem validação completa; Number(null) pode virar zero. Não suportado como importação alternativa |
| Orders/customer arrays ausentes ou data.js corrompido | Sem captura global; aplicação pode parar. Não existe tela amigável de recuperação |
| Período invertido na interface | setCustomValidity/reportValidity; mantém última renderização válida e bloqueia exportação enquanto inválido |
| Busca/catálogo sem correspondência | Produtos vazios, totais zero e mensagem na tabela; vendas sem participantes conforme seu próprio recorte |
| Nenhuma venda em intervalo válido | Série com zeros; pizza/ranking com mensagem; cartões comerciais zero |
| Nenhum pedido e datas não informadas no modelo analítico | Série vazia e totais zero; sem inventar intervalo |
| Intervalo acima de 40.000 buckets | Laço truncado sem aviso; totais podem deixar de reconciliar com série. Limitar uso a janelas menores até correção |
| true/false em caixa alta | Carga aceita; cálculo reconhece booleano; filtro de catálogo do modelo de estoque compara a string original e pode falhar. Fonte original minúscula passa; normalização é melhoria pendente |
| Data ISO aceita por Python em variante não canônica | Pode não ordenar/agrupar corretamente no JS. Fonte suportada deve fornecer AAAA-MM-DD canônico; endurecer validação é melhoria pendente |

Validação visual, responsividade, foco, tooltips, downloads e compatibilidade entre navegadores permanecem pendentes. Os testes existentes não comprovam tais interações. Não foi alterado código nesta entrega documental para resolver as limitações acima.

## S10 — Exemplos, resultados esperados e verificação

**Atende:** R02–R15.

### E01 — Base original completa

Sem filtros analíticos; intervalo 15/01/2024 a 14/06/2024:

| Medida | Esperado |
|---|---:|
| Produtos / unidades em estoque | 24 / 937 |
| Zerados / abaixo / elegíveis | 1 / 6 / 5 |
| Valor estimado do estoque | USD 4.763,00 |
| Unidades enviadas / pedidos enviados distintos | 65 / 17 |
| Valor dos itens / clientes compradores | USD 885,50 / 14 |

Estoque: `test.cjs`. Vendas: `test-analytics.cjs` verifica 17 pedidos, 65 unidades, reconciliações e agrupamentos; os valores 885,50 e 14 foram calculados e conferidos, mas não têm assert direto no arquivo atual.

### E02 — Série mensal original

| Início do bucket | Unidades | Valor USD | Pedidos distintos |
|---|---:|---:|---:|
| 2024-01-01 | 20 | 140,50 | 3 |
| 2024-02-01 | 9 | 141,50 | 3 |
| 2024-03-01 | 14 | 186,00 | 4 |
| 2024-04-01 | 6 | 137,00 | 2 |
| 2024-05-01 | 8 | 92,50 | 2 |
| 2024-06-01 | 8 | 188,00 | 3 |

Valores obtidos da execução verificada; não há asserts por mês no teste atual. Janeiro e junho representam bordas parciais do intervalo observado, não meses completos para inferir crescimento.

### E03 — Pedido com vários itens e cancelamento

Fixture sintética já presente em test-analytics.cjs:

- Pedido 1: shipped em 01/02/2024, cliente Ana Silva; produto A: 2 × USD 10; produto B descontinuado: 3 × USD 5.
- Pedido 2: cancelled na mesma data; produto A: 100 × USD 10.

Esperado sem filtro: 1 pedido, 5 unidades, USD 35, 1 cliente. Filtro produto A: 1 pedido, 2 unidades, USD 20. Filtro não descontinuados: 2 unidades. Cancelamento não adiciona vendas. Todos esses resultados principais têm asserts; a contagem de cliente único é comportamento esperado da função.

### E04 — Sem dados e fronteiras

- Base original, janeiro–março de 2025, grain month: 3 buckets com zeros; pedidos zero. Assert existente.
- Busca de produto inexistente no estoque: lista vazia. Assert existente.
- Data inicial = final = 01/02/2024 na fixture: pedido 1 incluído. Assert existente.
- grain day/week/month na base original: soma dos pedidos = 17 e unidades = 65. Asserts existentes.
- Período futuro não muda valor do estoque original: USD 4.763,00. Assert existente em test.cjs.
- Dataset sem pedidos e sem datas: série vazia. Comportamento inspecionado, sem assert específico atual.

### E05 — Reposição e ausência

- Hanging Basket: saldo 0, nível 10, não descontinuado → zero, below true, eligible true, gap 10.
- Bird Feeder: saldo 4, nível 6, descontinuado → low, below true, eligible false, gap 2, ação revisar catálogo.
- Hipótese sintética de fronteira: saldo 0 e nível 0 → zero, below false, eligible false.
- Campo quantity_on_hand = string vazia em chamada direta → invalid e total incomplete true. Assert existente.

Detalhes dos dois produtos e fronteira 0/0 estão especificados pela fórmula; nem todos possuem assert individual atual. Não apresentar inspeção de código como teste de navegador.

### E06 — Clientes e categorias

Base original, ranking por valor: Sofia Greer: USD 132,00, 2 pedidos e 9 unidades; Ava Nguyen: USD 100,00; Theo Brandt: USD 98,00. Valores conferidos pela execução, sem assert nominal atual.

Somar unidades por categoria e por cliente deve resultar em 65. Asserts existentes. Valores por cliente somam o total analítico com tolerância 1e-8 no teste. Percentuais da pizza são da apresentação e ainda exigem validação no navegador.

### Comandos e cobertura

Consultar comandos e estado de execução em AGENTS.md. Ambos os arquivos de testes passaram em 25/10/2026. Revalidar após alterações de regra ou dados. Acrescentar casos quando corrigir limites de S09, sem ampliar o escopo desta entrega documental.

## S11 — Matriz de rastreabilidade

| Requisito PRD | Seções técnicas | Evidência principal |
|---|---|---|
| R01 Navegação | S01, S06, S07 | Inspeção de index/app; navegador pendente |
| R02 Alertas | S03, S10 E01/E05 | test.cjs + fórmulas |
| R03 Estoque e tabela | S03, S07, S10 E01/E05 | test.cjs; tabela pendente de QA |
| R04 Prioridade | S03, S06 | Código e testes parciais |
| R05 Filtros | S04–S06, S09, S10 E04 | Testes de modelos; UI pendente |
| R06 Linhas | S04/S05, S10 E02/E04 | Testes de agregação; SVG pendente de QA |
| R07 Categorias/produtos | S04/S05, S10 E06 | Reconciliação de unidades; pizza pendente |
| R08 Clientes | S04, S08, S10 E06 | Reconciliação e execução; ranking/download pendentes |
| R09 Status/preços | S03/S04, S10 E03 | Ambos os testes |
| R10 Descontinuados | S03/S04, S09, S10 E03/E05 | Testes e ressalva de caixa alta |
| R11 Sem dados | S05/S09, S10 E04 | Testes parciais; mensagens pendentes de QA |
| R12 Detalhe/CSV | S05/S06/S08 | Inspeção; interações pendentes |
| R13 Carga/dados | S01/S02/S08/S09 | Carga original executada; falhas inspecionadas |
| R14 Reconciliação | S03/S04/S10 | Ambos os testes |
| R15 Limites | S05/S09 | Textos e documentação; QA visual pendente |
