/* =============================================================
   DN CELL — Função segura das avaliações do Google (Netlify Functions)

   Para que serve:
   A chave da API do Google NÃO pode ficar no site (qualquer pessoa
   veria no código). Esta função roda no servidor do Netlify, usa a
   chave guardada em segredo, consulta a Google Places API (New) e
   devolve ao site só os dados necessários.

   Endereço depois de publicada:  /api/avaliacoes

   Configuração (veja o LEIA-ME.md), no painel do Netlify:
   - GOOGLE_API_KEY   -> chave da API (Places API (New))
   - GOOGLE_PLACE_ID  -> Place ID da DN CELL

   Observações sobre as regras do Google:
   - A API devolve no máximo 5 avaliações, escolhidas pelo Google.
   - Nada é gravado em banco de dados ou arquivo. Só há um cache
     curto (CACHE_SEGUNDOS) para não consultar o Google a cada visita.
   - Nome, link do perfil e a origem "Google" continuam visíveis
     no site (o script.js já faz isso).
   ============================================================= */

const CACHE_SEGUNDOS = 300; // 5 minutos

export const config = { path: "/api/avaliacoes" };

export default async (requisicao) => {
  if (requisicao.method !== "GET") {
    return responderJson({ erro: "Método não permitido." }, 405);
  }

  const chave = Netlify.env.get("GOOGLE_API_KEY");
  const placeId = Netlify.env.get("GOOGLE_PLACE_ID");
  if (!chave || !placeId) {
    return responderJson({ erro: "Função sem configuração." }, 500);
  }

  let respostaGoogle;
  try {
    respostaGoogle = await fetch(
      "https://places.googleapis.com/v1/places/" + encodeURIComponent(placeId) + "?languageCode=pt-BR",
      {
        headers: {
          "X-Goog-Api-Key": chave,
          "X-Goog-FieldMask": "rating,userRatingCount,reviews"
        }
      }
    );
  } catch (erro) {
    return responderJson({ erro: "Não foi possível falar com o Google." }, 502);
  }

  if (!respostaGoogle.ok) {
    return responderJson({ erro: "O Google recusou a consulta." }, 502);
  }

  const lugar = await respostaGoogle.json();
  const corpo = {
    nota: typeof lugar.rating === "number" ? lugar.rating : null,
    total: typeof lugar.userRatingCount === "number" ? lugar.userRatingCount : null,
    avaliacoes: (lugar.reviews || []).map(function (r) {
      return {
        autor: (r.authorAttribution && r.authorAttribution.displayName) || "",
        autorUrl: (r.authorAttribution && r.authorAttribution.uri) || "",
        nota: r.rating,
        texto: (r.text && r.text.text) || (r.originalText && r.originalText.text) || "",
        data: r.publishTime || ""
      };
    })
  };

  // Cache curto no navegador e na rede do Netlify
  return responderJson(corpo, 200, {
    "Cache-Control": "public, max-age=" + CACHE_SEGUNDOS,
    "Netlify-CDN-Cache-Control": "public, max-age=" + CACHE_SEGUNDOS
  });
};

function responderJson(dados, status, extras) {
  return new Response(JSON.stringify(dados), {
    status: status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...(extras || {}) }
  });
}
