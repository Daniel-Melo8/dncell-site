# Avaliações do Google — como ativar (Netlify)

O site é HTML/CSS/JS. Para mostrar as avaliações reais do Google sem
expor a chave da API, existe a função `functions/avaliacoes.mjs`, que roda
no próprio Netlify e responde em `/api/avaliacoes`. O `script.js` já está
apontando para esse endereço.

Enquanto a configuração não estiver feita, a seção "O que nossos clientes
dizem" mostra só uma mensagem neutra e o botão **Avaliar no Google**.
Nenhuma avaliação é inventada.

## 1) Chave da API do Google

1. Entre em console.cloud.google.com e crie um projeto (ou use um existente).
2. Ative o **faturamento** (a API exige cartão; defina um alerta/limite de gastos
   e confira os preços atuais).
3. Em *APIs e serviços → Biblioteca*, ative a **Places API (New)**.
4. Em *Credenciais → Criar credenciais → Chave de API*.
5. Edite a chave e, em **Restrições de API**, marque **somente** "Places API (New)".

## 2) Place ID da DN CELL

Use a ferramenta "Place ID Finder" do Google e pesquise
"DN Cell, Rua Esperidião Rodrigues, 177-B, Arapiraca". O Place ID começa
com `ChIJ...` (não é o "ID do Perfil da Empresa").

## 3) Variáveis no Netlify

No painel do site: *Site configuration → Environment variables → Add a variable*

- `GOOGLE_API_KEY` = sua chave (marque como **secret**, se a opção aparecer)
- `GOOGLE_PLACE_ID` = o Place ID

## 4) Publicar o site COM a função

A função só funciona se o Netlify receber a pasta `netlify/` junto com o site.
O caminho recomendado é conectar o site a um repositório do **GitHub**
(*Add new site → Import an existing project*); a cada alteração enviada, o Netlify
publica site e função. Também funciona pelo **Netlify CLI** (`netlify deploy --prod`).

Depois de salvar as variáveis, faça um novo deploy para elas valerem.

## 5) Testar

Abra `https://SEU-SITE.netlify.app/api/avaliacoes`. Deve aparecer um texto JSON
com `nota`, `total` e `avaliacoes`. Se aparecer `{"erro": ...}`:

- "Função sem configuração": faltou variável (passo 3) ou novo deploy.
- "O Google recusou a consulta": confira a chave, a restrição de API,
  o faturamento e o Place ID.

## Regras e limites

- O Google devolve **no máximo 5 avaliações**, escolhidas por ele.
- Há um cache de 5 minutos (`CACHE_SEGUNDOS`). Nada é salvo em banco de dados.
- O site mostra nome do autor (com link para o perfil), nota, texto, data e
  a origem "Google", como pede a política de atribuição.
- A moderação (responder, denunciar, apagar) continua sendo feita no
  Perfil da Empresa no Google.
