# AgendamentoIA

SaaS multi-tenant para automatizar agendamentos pelo WhatsApp usando IA. O assistente conversa com clientes, consulta horários e cria ou cancela agendamentos; a equipe acompanha tudo no dashboard.

## Stack

- Next.js 14, App Router e TypeScript
- Tailwind CSS e shadcn/ui
- Supabase: Postgres, Auth e RLS
- Evolution API self-hosted via Docker
- OpenAI GPT-4o com function calling

## Estrutura esperada

- `app/`: páginas App Router e rotas em `app/api/`
- `components/`: componentes reutilizáveis de UI e dashboard
- `lib/`: clientes, utilitários, regras de domínio e integrações servidor
- `types/`: tipos TypeScript compartilhados
- `supabase/`: migrations, políticas RLS e configuração de banco
- `docker/` ou `docker-compose.yml`: serviços locais, incluindo Evolution API quando aplicável

## Convenções obrigatórias

- Usar TypeScript e App Router; evitar Pages Router.
- Todo dado operacional pertence a um tenant e deve ser filtrado por `client_id`.
- O isolamento de tenant deve existir tanto nas queries/regras de servidor quanto em RLS do Supabase.
- O schema aplicado no Supabase é a fonte de verdade para tabelas, colunas e constraints. Consulte `prd.json` (nota de `data_entities`) e a migration aplicada antes de planejar ou implementar; não invente nomes de coluna.
- Em caso de divergência ou dúvida sobre schema, confirme com Poseidon ou com o Orquestrador antes de seguir.
- Nunca confiar em `client_id` enviado pelo navegador: derive-o da sessão autenticada ou de um mapeamento seguro da instância Evolution API.
- Nunca exponha `SUPABASE_SERVICE_ROLE_KEY`, chave OpenAI, token Evolution API ou segredos de cron no frontend.
- Chaves privilegiadas só podem ser usadas no servidor, no menor escopo possível.
- Rotas de webhook devem ser idempotentes e validar sua origem/autorização.

## Rodar localmente

1. Instale as dependências com `npm install`.
2. Copie `.env.example` para `.env.local` e preencha as variáveis de Supabase, OpenAI, Evolution API e segredos de webhook/cron.
3. Inicie os serviços locais necessários (Supabase e Evolution API via Docker, conforme os arquivos do projeto).
4. Execute `npm run dev` e abra `http://localhost:3000`.

Consulte `prd.json` para o escopo detalhado, entidades, páginas, rotas e direção visual.
