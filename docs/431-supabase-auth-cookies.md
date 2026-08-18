# HTTP 431 no login — cookies de sessão do Supabase

## Sintoma

Ao tentar fazer login em `/login`, o navegador retorna `HTTP 431 Request Header Fields Too Large`. O 431 indica que o **header `Cookie` da requisição excede o limite** do servidor (o padrão do Node é ~8–16KB para o conjunto de headers).

## Causa raiz

O `@supabase/ssr` (browser client) persiste a sessão em cookies `sb-<project-ref>-auth-token` (prefixo real aqui: `sb-anirmcbdnzwwlqtxpwng-auth-token`). Como o JWT de acesso do Supabase pode incluir `user_metadata`, `app_metadata` e `identities` (bloat de providers/metadata), a sessão serializada pode:

1. **Crescer acima do limite** — valores grandes são quebrados em chunks `sb-<ref>-auth-token.0`, `.1`, `.2`; a soma deles no header `Cookie` estoura o limite; e/ou
2. **Acumular múltiplos cookies** — sessões órfãs/duplicadas deixadas por logins interrompidos, signups repetidos ou refresh de token com escrita parcial; e/ou
3. **Deixar verifiers PKCE órfãos** (`sb-<ref>-auth-token-code-verifier`, `-flow-<id>-code-verifier`, `-flows-code-verifier`) quando um fluxo falha no meio.

Esse padrão é documentado pela comunidade no mesmo stack (Next.js 14 + hosted Supabase + `@supabase/ssr`): supabase/ssr issues #56 e #78 (relatos de 3–13 cookies `auth-token` grandes → 431, às vezes resolvido apenas recriando o usuário).

### O que foi descartado neste projeto

- `middleware.ts` não toca em cookies/auth (apenas seta o header `x-pathname`) — não é o emissor.
- As páginas do app não emitem `Set-Cookie` em requisições GET (verificado localmente).
- `@supabase/ssr` 0.12.x gerencia corretamente chunking/limpeza no source — o problema é de acúmulo no browser/estado do usuário, não do library em si.

## Fix aplicado (defensivo)

- **`app/(auth)/layout.tsx`**: usuários já autenticados que acessam `/login` ou `/signup` são redirecionados para `/dashboard` (evita re-login e novas escritas de cookie desnecessárias).
- **`lib/auth-cookies.ts`** + **`login/page.tsx` / `signup/page.tsx`**: ao montar a página (com `getUser()` confirmando que **não** há sessão válida), remove cookies `sb-<ref>-auth-token*` órfãos/duplicados (chunks `.N` e verifiers PKCE). Não limpa sessão válida — o layout e o `getUser()` client protegem isso.
- **`components/dashboard/sign-out-button.tsx`**: após `signOut()`, faz purge total de todos os cookies `sb-<ref>-auth-token*` que o library porventura não tenha removido.

## Recomendação (causa raiz no Supabase)

Enxugar o tamanho do JWT de acesso para evitar o crescimento do cookie:

1. **Habilitar assinatura assimétrica (Asymmetric JWT)** em `Supabase Dashboard > Settings > API > JWT Signing Keys`. Reduz significativamente o tamanho do access token (troca do HS256 por RS256/ES256). Esse é o caminho oficial recomendado pela equipe do Supabase (previsto no rollout de "asymmetric JWTs").
2. **Custom Access Token Hook** para emitir um JWT mínimo (apenas claims essenciais), ignorando metadata/identities do usuário.
3. **Manter `user_metadata`/`app_metadata` mínimos** no cadastro (evitar dados volumosos em `options.data` do signup).

## Status de validação

- Build e lint passam após o fix.
- Validação end-to-end (login real em browser com medição de cookies): **pendente** — o Supabase Auth estava retornando `429` (rate limit de signup por IP) no momento da implementação. Assim que o limite liberar, criar uma conta de teste própria (`teste.kernel.<timestamp>@...`) e validar o fluxo.
