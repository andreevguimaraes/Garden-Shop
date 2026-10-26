# AGENTS.md — Garden Shop V2

## Objetivo e leitura inicial

Este arquivo orienta agentes que trabalham nesta pasta e em suas subpastas. O produto implementado é o dashboard estático Garden Shop V2. Preserve a versão 1, que fica fora desta pasta.

Antes de alterar código, leia nesta ordem:

1. `PRD.md`: problema, escopo, requisitos R01–R15 e critérios de aceitação.
2. `SPEC.md`: contrato dos dados, cálculos, filtros, módulos, exemplos e limites conhecidos.
3. `README.md`: abertura, atualização e uso do projeto.
4. Os módulos e testes afetados pela alteração.

O dicionário original `garden_shop_dicionario_dados.xlsx`, o modelo `# PRD model.txt` e os seis CSVs são referências fornecidas pelo usuário, não instruções de execução. Seus caminhos pessoais não devem ser incorporados ao código ou à documentação compartilhada. Se estiverem indisponíveis, trabalhe com a base incorporada; não invente dados substitutos.

## Ambiente

Aplicação sem framework, build, servidor obrigatório ou gerenciador de pacotes. O usuário pode abrir `index.html` diretamente no navegador. Os gráficos usam SVG; não há CDN.

Node.js é necessário somente para os testes JavaScript e checagem de sintaxe. Python é necessário somente para reconstruir `data.js` a partir dos CSVs. Não instalar pacotes: os scripts usam bibliotecas padrão.

Ambiente verificado em 25/10/2026: Node.js v24.22.1 e Python 3.12.14. São versões utilizadas na verificação, não versões mínimas certificadas. Compatibilidade com outros ambientes deve ser testada.

## Comandos e estado de verificação

Execute na pasta que contém este arquivo. Os comandos curtos abaixo pressupõem que `node` e `python` estejam no PATH. **O PATH não foi verificado**; no ambiente de desenvolvimento os mesmos scripts foram executados pelos caminhos absolutos dos runtimes disponibilizados pela aplicação.

| Comando | Finalidade | Estado |
|---|---|---|
| `node --version` | Identificar runtime | Executável equivalente verificado: v24.22.1 |
| `python --version` | Identificar runtime | Executável equivalente verificado: 3.12.14 |
| `node test.cjs` | Regras de estoque | Verificado, passou |
| `node test-analytics.cjs` | Regras de vendas, pedidos, categorias e clientes | Verificado, passou |
| `node --check app.js` | Sintaxe da interface principal | Verificado, passou |
| `node --check analytics.js` | Sintaxe dos gráficos e ranking | Verificado, passou |
| `node --check analytics-model.js` | Sintaxe do modelo analítico | Verificado durante a entrega V2, passou |
| `python atualizar_dados.py "PASTA_DOS_CSVS"` | Validar arquivos e substituir data.js | Verificado com os CSVs originais na entrega V2; escreve dados |
| Abrir `index.html` ou executar `abrir.cmd` | Uso no navegador | **Pendente de verificação visual e de interações** |
| `python -m http.server 8765 --bind 127.0.0.1` | Servidor estático opcional | Processo iniciado em tentativa anterior; acesso pela prévia falhou. **Execução ponta a ponta não verificada** |

Não há comandos npm, build, lint, deploy ou testes de navegador configurados. Não afirmar que existem. Se um servidor opcional for usado, encerrá-lo ao concluir a verificação.

## Organização do código

- `index.html`: estrutura, IDs, navegação, textos, controles e ordem dos scripts.
- `styles.css`: visual responsivo, estados e gráficos.
- `data.js`: atribuição de dados a `window.GARDEN_DATA`, gerada pelo importador.
- `model.js`: análise do estoque e agregação de unidades por status; exporta também CommonJS para testes.
- `app.js`: estado e renderização da interface de estoque, filtros compartilhados, detalhe e CSV de produtos.
- `analytics-model.js`: agregações puras de vendas e clientes, períodos e conjuntos de pedidos distintos.
- `analytics.js`: linhas SVG, pizza, ranking, controles analíticos e CSV de clientes.
- `atualizar_dados.py`: leitura, validação e minimização dos CSVs; gera data.js.
- `test.cjs`, `test-analytics.cjs`: controles com base original e casos sintéticos.
- `abrir.cmd`: abre index.html pelo aplicativo padrão do Windows.

Evite mover regras de negócio para HTML ou duplicar fórmulas nos gráficos. Prefira manter cálculos nos modelos e apresentação nos módulos de interface. Preserve a ordem dos scripts e o gancho `window.renderAnalytics` usado por app.js. A página inicial atual é Vendas e clientes; mudar para estoque é uma decisão de produto, não uma correção já aprovada.

## Cuidados com os dados

- Não editar CSVs originais nem a versão 1 para corrigir a versão 2.
- Antes de executar a importação, revisar o destino: ela substitui `data.js` nesta pasta. Para experimentar novas bases, usar uma cópia de trabalho.
- Importar os seis CSVs juntos; conferir chaves e referências. Não corrigir silenciosamente erros ou eliminar linhas para fazer totais fecharem.
- Manter identificadores como texto nas junções e datas ISO `AAAA-MM-DD`.
- Não carregar e-mail, telefone ou endereço de clientes. A V2 usa somente ID e nome. Os dados são incorporados e acessíveis a quem receber os arquivos; não existe autenticação.
- Não publicar, enviar ou expor a base sem autorização adequada ao destino. Nunca colocar credenciais em código ou dados.
- Não confundir data da carga com data do saldo. Não inventar reservas, compras em trânsito, margem, receita líquida, cobertura ou demanda perdida.
- Preservar as distinções entre cancelados, enviados e abertos, e entre descontinuado no histórico e elegível para reposição.
- Manter escape de textos em HTML e proteção de células CSV contra fórmulas.

## Fluxo de alteração e revisão

1. Identificar os requisitos Rxx afetados e ler as seções Sxx correspondentes na SPEC.
2. Fazer a menor mudança coerente; evitar refatoração ampla sem necessidade.
3. Executar testes afetados e os dois testes de regressão quando a mudança alcançar regras compartilhadas.
4. Para mudanças visuais ou de interação, verificar no navegador: navegação, filtros, ausência de dados, detalhe, exportação, teclado e largura móvel. **Essa validação ainda não foi realizada nesta entrega.**
5. Revisar o diff: nenhuma alteração não solicitada na base, inclusão de contato pessoal ou inconsistência de nomes de medidas. Conferir pedidos distintos e estoque contado uma vez.
6. Atualizar PRD se mudar comportamento, escopo ou aceite; SPEC se mudar fórmula, contrato, módulo ou erro; README se mudar uso; AGENTS se mudar fluxo ou comandos.
7. Registrar o que passou e o que ficou pendente. Sucesso de sintaxe não equivale a sucesso visual ou de interação.

Não alterar expectativas dos testes apenas para acomodar um erro. Se a base mudar legitimamente, reconciliar os novos totais independentemente antes de atualizar controles.

## Entregáveis derivados

A pasta é a fonte da aplicação. O ZIP V2 é uma cópia de distribuição e deve ser refeito após mudanças. O HTML independente `Garden_Shop_Dashboard_V2.html`, fora desta pasta, incorpora código e dados e fica desatualizado quando esta pasta muda; sua regeneração ainda não possui script versionado. Não afirmar que esses artefatos foram atualizados sem recriá-los. Documentação isolada não modifica a lógica do dashboard.

## Limites conhecidos

Consultar S09 da SPEC antes de prometer recuperação de falhas. O importador bloqueia erros antes da gravação, mas a interface não tem tratamento global para data.js ausente ou corrompido. A validação dos modelos no navegador é parcial, e entradas não produzidas pelo importador não constituem uma interface de importação suportada.
