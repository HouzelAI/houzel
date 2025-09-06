# Houzel – Corretor de Redações com Chat Interativo

O **Houzel** é uma aplicação web desenvolvida em **Laravel + React** que oferece uma experiência de correção de redações em tempo real através de um chat amigável.
O objetivo principal é tornar o processo de prática e avaliação de textos mais dinâmico, acessível e intuitivo.

Este projeto faz parte do Trabalho de Conclusão de Curso em Ciência da Computação, com foco em explorar tecnologias modernas de **aplicações web em tempo real**.

---

## O que é o Houzel?

Tradicionalmente, correções de redação são feitas de forma estática: o estudante escreve, envia, e aguarda o retorno do avaliador.
O Houzel transforma esse fluxo em uma **conversa contínua**, onde cada versão do texto é analisada e o estudante recebe feedback imediato em formato de chat.

* **Correção em tempo real**: o estudante envia seu texto e recebe observações instantâneas.
* **Interface amigável**: um chat moderno, inspirado em apps de mensagens.
* **Foco no aprendizado**: feedbacks estruturados com notas e sugestões de melhoria.
* **Histórico salvo**: todas as interações ficam armazenadas, permitindo acompanhar a evolução do estudante.
* **Ambiente responsivo**: totalmente adaptado para desktop e dispositivos móveis.

---

## Principais Recursos

* **Chat estilo tutor virtual** para prática de redações.
* **Persistência de mensagens** com autenticação opcional.
* **Feedback detalhado** em critérios como clareza, coesão e argumentação.
* **Design moderno** com Tailwind CSS v4 e shadcn/ui.
* **Suporte a temas claro/escuro**.

---

## Tecnologias Utilizadas

* **Laravel 12** – backend, API e gerenciamento do fluxo.
* **React 19 + Inertia.js** – frontend interativo.
* **Tailwind CSS v4** – estilização moderna e responsiva.
* **SQLite/MySQL/PostgreSQL** – bancos de dados suportados.

---

## Instalação Rápida

1. Clone o repositório e instale as dependências:

```bash
composer install
npm install
```

2. Configure o ambiente:

```bash
cp .env.example .env
php artisan key:generate
```

3. Rode as migrações e inicie o servidor de desenvolvimento:

```bash
php artisan migrate
composer dev
```

---

## Roadmap

* [x] Chat com feedback interativo
* [x] Autenticação de usuários
* [ ] Painel para professores acompanharem múltiplos alunos
* [ ] Exportação de relatórios de desempenho
* [ ] Integração com serviços externos de avaliação

---

## Licença

O Houzel é um software open source licenciado sob a [MIT License](LICENSE.md).
