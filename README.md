# 🍽️ API Restaurante

Um sistema de **gerenciamento de restaurante** que oferece funcionalidades voltadas para diferentes perfis de usuário: **Atendentes**, **Garçons** e **Gerentes**. A aplicação é composta por uma API REST em **Node.js** com banco de dados **SQLite**, além de uma interface web simples em HTML/CSS/JS.

---

## 🧾 Descrição do Projeto

Este projeto visa controlar o fluxo de trabalho de um restaurante, incluindo:

- Criação e gerenciamento de **reservas**;
- Controle de **mesas** e seus status (ocupadas, livres, etc.);
- Módulos específicos para **Atendentes**, **Garçons** e **Gerentes**;
- Geração de **relatórios** sobre reservas e ocupação;
- Interface web leve, que se conecta à API usando fetch (Vanilla JS).

---

## ⚙️ Tecnologias Utilizadas

- **Node.js** (v14+)  
- **Express** (v4.x)  
- **SQLite3** (v5.x)  
- **JavaScript** (Vanilla) no frontend  
- **HTML5** / **CSS3**  

---

## 📁 Estrutura do Projeto

APIrestaurante-main/
- │
- ├── server.js                # Servidor principal da API (Express + SQLite)
- ├── database_setup.js        # Criação e configuração inicial do banco de dados
- ├── restaurant.db            # Banco de dados SQLite
- ├── package.json             # Dependências e scripts do projeto
- ├── package-lock.json        # Lockfile gerado pelo npm
- │
- ├── clean_reservas.js        # Script de limpeza de reservas (ex.: remover antigas)
- ├── garcons.js               # Rotas e lógica relacionadas a garçons
- ├── mesas.js                 # Rotas e lógica relacionadas a mesas
- ├── relatorios.js            # Rotas para geração de relatórios
- ├── reservas.js              # Rotas para gerenciar reservas
- │
- └── SITE/                    # Diretório da interface web
  -    ├── index.html           # Página inicial (Login/seleção de perfil)
  -    ├── atendente.html       # Tela para Atendentes
  -    ├── garcom.html          # Tela para Garçons
  -    ├── gerente.html         # Tela para Gerentes
  -    ├── style.css            # Estilos gerais das páginas
  -    ├── main.js              # Funções JS compartilhadas (API_URL, helpers etc.)
  -    ├── atendente.js         # Lógica de frontend para o perfil Atendente
  -    ├── garcom.js            # Lógica de frontend para o perfil Garçom
  -    └── gerente.js           # Lógica de frontend para o perfil Gerente

## 🚀 Como Executar
1. Clone o Repositório
- git clone https://github.com/SEU_USUARIO/APIrestaurante-main.git
- cd APIrestaurante-main

2. Instale as dependências
- npm install

3. Configurando o banco de dados
- node setup_db.js

4. Inicie o servidor
- node server.js

## 🔑 Funcionalidades por Perfil
📝 Atendentes

    Criar, editar e cancelar reservas

        Cadastro de nome do cliente, número de pessoas, data e hora.

        Validação de disponibilidade de mesas antes de confirmar a reserva.

    Visualizar situação das mesas

        Quais mesas estão livres, ocupadas ou reservadas.

        Atualização manual do status das mesas (ex.: de “Ocupada” para “Limpeza”).

🍽️ Garçons

    Listar todas as mesas sob sua responsabilidade

        Ver se a mesa está livre, ocupada ou pendente de pagamento.

    Atualizar status da mesa

        Ex.: “Mesa 5 – Pedido finalizado”, “Mesa 3 – Solicitando conta”.

📊 Gerentes

    Gerar relatórios de reservas

        Quantidade de reservas por dia, por faixa de horário etc.

        Filtrar por período (diário, semanal, mensal).

    Visualizar ocupação geral do restaurante

        Percentual de mesas ocupadas em tempo real.

        Histórico de ocupação para auxiliar na tomada de decisão (horários de pico, folgas de funcionários etc.).

🛠️ Descrição dos Scripts Principais

    server.js

        Configuração do servidor Express

        Conexão com o banco SQLite (restaurant.db)

        Registro de rotas:

            /mesas (CRUD de mesas)

            /garcons (CRUD de garçons)

            /reservas (CRUD de reservas)

            /relatorios (endpoints para geração de relatórios)

            Outros endpoints auxiliares (ex.: /clean_reservas).

        Middlewares para tratamento de JSON e CORS (se necessário).

    database_setup.js

        Cria as tabelas iniciais no SQLite:

            mesas (id, número, capacidade, status)

            garcons (id, nome, turno, mesas_atribuidas)

            reservas (id, nome_cliente, qtde_pessoas, data_hora, mesa_id, status)

            Tabelas de logs e configurações adicionais, se houver.

        Popula dados iniciais (ex.: mesas de 1 a 20, funcionários padrão etc.).

    clean_reservas.js

        Remove ou marca como “expiradas” reservas antigas (data passada).

        Pode ser agendado via cronjob ou executado manualmente.

    garcons.js, mesas.js, reservas.js, relatorios.js

        Cada arquivo exporta grupos de rotas e handlers para a API:

            garcons.js: GET /garcons, POST /garcons, PUT /garcons/:id, DELETE /garcons/:id

            mesas.js: GET /mesas, POST /mesas, PUT /mesas/:id, DELETE /mesas/:id

            reservas.js: GET /reservas, POST /reservas, PUT /reservas/:id, DELETE /reservas/:id

            relatorios.js: GET /relatorios/reservas, GET /relatorios/ocupacao

💻 Frontend (Diretório SITE/)

Toda interface está baseada em arquivos estáticos e usa fetch para se comunicar com a API.
Arquivos Principais

    index.html

        Página inicial que redireciona para a seção adequada (Atendente, Garçom ou Gerente).

        Botões ou links para atendente.html, garcom.html e gerente.html.

    atendente.html

        Formulário para criar novas reservas (nome, nº de pessoas, data/hora).

        Tabela/listagem de reservas atuais e futuras.

        Possibilidade de cancelar ou editar uma reserva.

    garcom.html

        Lista todas as mesas atribuídas ao garçom.

        Botões para atualizar o status da mesa (ex.: “Pedido finalizado”, “Conta solicitada”).

    gerente.html

        Painel de relatórios:

            Filtro por período (diário, semanal, mensal).

            Gráfico simples (pode ser futuro upgrade) ou tabela de ocupação/reservas.

        Visualização geral das mesas (percentual de ocupação atual).

    main.js

        Define a constante API_URL baseada em window.location para facilitar chamadas (ex.: http://localhost:3000).

        Funções utilitárias:

            fetchJSON(endpoint, method, body): wrapper para fetch com tratamento de JSON.

            renderTable(data, containerId): gera tabelas HTML dinamicamente.

        Event listeners para carregamento de página e envio de formulários.

    atendente.js

        Lógica de frontend específica para criar/editar/cancelar reservas.

        Validação básica de formulário (campo vazio, formato de data/hora).

    garcom.js

        Lógica para listar mesas do garçom e atualizar status em tempo real.

        Exemplo: PUT /mesas/:id alterando o campo status.

    gerente.js

        Funções para recuperar dados de /relatorios.

        Gera tabela ou exibe números (total de reservas no período, percentual de ocupação).

    style.css

        Reset básico (* { margin: 0; padding: 0; box-sizing: border-box; })

        Layouts flexbox para formulários e tabelas.

        Classes para botões, tabelas, cabeçalhos.
