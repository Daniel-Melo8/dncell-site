/* =============================================================
   DN CELL — Script do site

   O que este arquivo faz:
   1) Monta os links de WhatsApp de todos os botões
   2) Monta o link de WhatsApp de cada serviço (mensagem própria)
   3) Liga o botão da loja virtual (quando o endereço estiver configurado)
   4) Carrega e mostra as avaliações reais do Google
   5) Preenche o ano do rodapé automaticamente
   6) Esconde imagens que não carregaram (evita o ícone quebrado)
   7) Faz os blocos aparecerem suavemente ao rolar a página
   ============================================================= */


/* -------------------------------------------------------------
   CONFIGURAÇÃO — EDITE AQUI
   ------------------------------------------------------------- */
const CONFIG = {

  // WhatsApp: código do país (55) + DDD + número, tudo junto,
  // sem espaços, parênteses ou traços.
  // Exemplo: 55 + 82 + 912345678  ->  "5582912345678"
  whatsappNumero: "5582996082952", // <- TROQUE pelo número real da DN Cell

  // Mensagem dos botões gerais de WhatsApp
  mensagem: "Olá! Vim pelo site e gostaria de agendar um orçamento.",

  // Mensagem dos cards de serviço. {servico} vira o texto do atributo
  // data-servico de cada card (ex.: "limpeza interna de celulares").
  mensagemServico:
    "Olá! Gostaria de saber mais sobre o serviço de {servico}. Poderia me passar mais informações?",

  // Endereço da LOJA VIRTUAL (ex.: "https://www.sualoja.com.br").
  // Deixe vazio ("") e o botão "Acessar nossa loja" fica escondido.
  lojaUrl: "https://loja-dn-cell.web.app/",

  // Endereço da função segura que devolve as avaliações do Google
  // (veja a pasta "servidor" e o arquivo LEIA-ME.md).
  // Deixe vazio ("") e a seção mostra apenas o botão "Avaliar no Google".
  avaliacoesEndpoint: "/api/avaliacoes"
};


/* -------------------------------------------------------------
   Utilitários
   ------------------------------------------------------------- */

// Monta um link do WhatsApp com a mensagem já codificada
function linkWhatsapp(mensagem) {
  return (
    "https://wa.me/" + CONFIG.whatsappNumero +
    "?text=" + encodeURIComponent(mensagem)
  );
}

// Só aceita endereços http(s) válidos (evita links quebrados ou perigosos)
function urlSegura(texto) {
  try {
    const url = new URL(texto, window.location.href);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch (erro) {
    return null;
  }
}


/* -------------------------------------------------------------
   1) Links gerais do WhatsApp
   Todo link/botão com o atributo data-whatsapp recebe o endereço.
   ------------------------------------------------------------- */
function montarLinksWhatsapp() {
  const endereco = linkWhatsapp(CONFIG.mensagem);

  document.querySelectorAll("[data-whatsapp]").forEach(function (link) {
    link.href = endereco;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });
}


/* -------------------------------------------------------------
   2) Links dos serviços
   Cada card com data-servico abre o WhatsApp com uma mensagem
   que cita o serviço escolhido.
   ------------------------------------------------------------- */
function montarLinksServicos() {
  document.querySelectorAll("[data-servico]").forEach(function (card) {
    const mensagem = CONFIG.mensagemServico.replace("{servico}", card.dataset.servico);
    card.href = linkWhatsapp(mensagem);
    card.target = "_blank";
    card.rel = "noopener noreferrer";
  });
}


/* -------------------------------------------------------------
   3) Loja virtual
   O botão só aparece quando CONFIG.lojaUrl tem um endereço válido.
   ------------------------------------------------------------- */
function configurarLoja() {
  const endereco = urlSegura(CONFIG.lojaUrl);

  document.querySelectorAll("[data-loja]").forEach(function (botao) {
    if (!endereco) {
      botao.hidden = true;
      return;
    }
    botao.href = endereco;
    botao.target = "_blank";
    botao.rel = "noopener noreferrer";
    botao.hidden = false;
  });
}


/* -------------------------------------------------------------
   4) Avaliações do Google
   Busca as avaliações na função segura (a chave do Google fica
   no servidor, nunca aqui) e desenha os cartões.
   Se não houver avaliações ou der erro, mostra só a mensagem
   neutra e o botão "Avaliar no Google" — nunca inventa avaliações.
   ------------------------------------------------------------- */
const SVG_NS = "http://www.w3.org/2000/svg";

// Desenha 5 estrelas; as primeiras "nota" ficam preenchidas
function criarEstrelas(nota) {
  const fragmento = document.createDocumentFragment();
  const arredondada = Math.round(nota);

  for (let i = 1; i <= 5; i++) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "estrela" + (i <= arredondada ? " estrela--cheia" : ""));
    const uso = document.createElementNS(SVG_NS, "use");
    uso.setAttribute("href", "#i-estrela");
    svg.appendChild(uso);
    fragmento.appendChild(svg);
  }
  return fragmento;
}

function formatarData(texto) {
  const data = new Date(texto);
  if (isNaN(data.getTime())) {
    return "";
  }
  return data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

// Cria o cartão de uma avaliação (usa textContent: nada do Google vira HTML)
function criarCartaoAvaliacao(avaliacao) {
  const cartao = document.createElement("figure");
  cartao.className = "cartao depoimento avaliacao";

  // Linha do topo: nome + data
  const topo = document.createElement("div");
  topo.className = "avaliacao__topo";

  const enderecoAutor = urlSegura(avaliacao.autorUrl);
  const autor = document.createElement(enderecoAutor ? "a" : "span");
  autor.className = "avaliacao__autor";
  autor.textContent = avaliacao.autor || "Cliente do Google";
  if (enderecoAutor) {
    autor.href = enderecoAutor;
    autor.target = "_blank";
    autor.rel = "noopener noreferrer";
  }
  topo.appendChild(autor);

  const data = formatarData(avaliacao.data);
  if (data) {
    const campoData = document.createElement("span");
    campoData.className = "avaliacao__data";
    campoData.textContent = data;
    topo.appendChild(campoData);
  }
  cartao.appendChild(topo);

  // Estrelas
  const estrelas = document.createElement("div");
  estrelas.className = "estrelas";
  estrelas.setAttribute("role", "img");
  estrelas.setAttribute("aria-label", "Nota " + avaliacao.nota + " de 5");
  estrelas.appendChild(criarEstrelas(avaliacao.nota));
  cartao.appendChild(estrelas);

  // Texto (algumas avaliações têm só a nota, sem comentário)
  if (avaliacao.texto) {
    const texto = document.createElement("blockquote");
    texto.textContent = avaliacao.texto;
    cartao.appendChild(texto);
  }

  // Origem
  const origem = document.createElement("figcaption");
  origem.className = "avaliacao__origem";
  origem.textContent = "Avaliação publicada no Google";
  cartao.appendChild(origem);

  return cartao;
}

function mostrarSemAvaliacoes() {
  const vazio = document.getElementById("avaliacoes-vazio");
  if (vazio) {
    vazio.hidden = false;
  }
}

function desenharAvaliacoes(dados) {
  const lista = document.getElementById("avaliacoes-lista");

  // Confere o formato recebido e descarta itens inválidos
  const avaliacoes = Array.isArray(dados && dados.avaliacoes)
    ? dados.avaliacoes.filter(function (a) {
        return a && typeof a.nota === "number" && a.nota >= 1 && a.nota <= 5;
      })
    : [];

  if (!lista || avaliacoes.length === 0) {
    mostrarSemAvaliacoes();
    return;
  }

  avaliacoes.forEach(function (avaliacao) {
    lista.appendChild(criarCartaoAvaliacao(avaliacao));
  });

  // Resumo: nota média e total de avaliações
  if (typeof dados.nota === "number" && typeof dados.total === "number") {
    document.getElementById("avaliacoes-nota").textContent =
      dados.nota.toFixed(1).replace(".", ",");
    document.getElementById("avaliacoes-estrelas").appendChild(criarEstrelas(dados.nota));
    document.getElementById("avaliacoes-total").textContent =
      dados.total + (dados.total === 1 ? " avaliação no Google" : " avaliações no Google");
    document.getElementById("avaliacoes-resumo").hidden = false;
  }
}

function carregarAvaliacoes() {
  const endereco = urlSegura(CONFIG.avaliacoesEndpoint);

  if (!endereco) {
    mostrarSemAvaliacoes();
    return;
  }

  // Desiste depois de 8 segundos para não deixar a seção "pendurada"
  const controle = new AbortController();
  const limite = setTimeout(function () { controle.abort(); }, 8000);

  fetch(endereco, { signal: controle.signal })
    .then(function (resposta) {
      if (!resposta.ok) {
        throw new Error("Resposta " + resposta.status);
      }
      return resposta.json();
    })
    .then(desenharAvaliacoes)
    .catch(function (erro) {
      console.warn("Não foi possível carregar as avaliações do Google:", erro);
      mostrarSemAvaliacoes();
    })
    .finally(function () {
      clearTimeout(limite);
    });
}


/* -------------------------------------------------------------
   5) Ano no rodapé
   ------------------------------------------------------------- */
function preencherAno() {
  const campo = document.getElementById("ano");
  if (campo) {
    campo.textContent = new Date().getFullYear();
  }
}


/* -------------------------------------------------------------
   6) Imagens que não carregaram
   Se o arquivo não existir (ou o caminho estiver errado),
   a imagem fica invisível em vez de mostrar o ícone quebrado.
   ------------------------------------------------------------- */
function tratarImagensQuebradas() {
  document.querySelectorAll("img").forEach(function (img) {
    img.addEventListener("error", function () {
      img.classList.add("sem-imagem");
    });

    // Caso o erro já tenha acontecido antes do script rodar
    const temCaminho = img.getAttribute("src");
    if (temCaminho && img.complete && img.naturalWidth === 0) {
      img.classList.add("sem-imagem");
    }
  });
}


/* -------------------------------------------------------------
   7) Animação ao rolar a página
   Elementos com a classe "revelar" aparecem suavemente.
   ------------------------------------------------------------- */
function animarAoRolar() {
  const elementos = document.querySelectorAll(".revelar");

  // Navegadores antigos: deixa tudo visível, sem animação
  if (!("IntersectionObserver" in window)) {
    return;
  }

  const observador = new IntersectionObserver(
    function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.remove("revelar--oculto");
          entrada.target.classList.add("revelar--visivel");
          observador.unobserve(entrada.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  elementos.forEach(function (elemento) {
    elemento.classList.add("revelar--oculto");
    observador.observe(elemento);
  });
}


/* -------------------------------------------------------------
   Inicialização
   ------------------------------------------------------------- */
montarLinksWhatsapp();
montarLinksServicos();
configurarLoja();
carregarAvaliacoes();
preencherAno();
tratarImagensQuebradas();
animarAoRolar();
