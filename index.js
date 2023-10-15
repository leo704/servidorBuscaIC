// integrado ao BD

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const port = 8080;
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://zqrjiwthzsuyspjyvnhk.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxcmppd3RoenN1eXNwanl2bmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTczMTc2NDQsImV4cCI6MjAxMjg5MzY0NH0.kzw5QhgMeOpf5CngMiKl-aT2ouRscYEXINC4OGbK3GI"
);

var termo,
  arquivo,
  nome,
  resposta = 0;

app.use(bodyParser.json());
app.use(
  cors({
    origin: "http://localhost:8080/", // Substitua pelo endereço do seu site
    methods: "GET",
    allowedHeaders: "Content-Type,Authorization",
  })
);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/", (req, res) => {
  res.send("Ok – Servidor disponível.");
});

app.get("/buscar/:palavraChave", (req, res) => {
  const palavraChave = req.params.palavraChave;
  if (!palavraChave) {
    return res.status(400).json({
      error:
        "A solicitação deve incluir uma palavra chave para ser processada.",
    });
  }
  termo = palavraChave;
  async function poeOrdem() {
    resposta = await fetchDataFromSupabase(); //essa e depois a linha de baixo
    console.log("Mandando a respota");
    res.json(resposta);
    // console.log(resposta);
  }
  poeOrdem();
});

async function fetchDataFromSupabase() {
  try {
    const { data, error } = await supabase
      .from("PPCs_Convertidos_Json")
      .select("nomePPC, PPC");
    if (error) {
      console.error("Erro ao recuperar dados do BD:", error);
    } else {
      data.forEach((item) => {
        arquivo = JSON.parse(item.PPC);
        nome = item.nomePPC;
        funcaoAssincrona(() => {
          // console.log("Após função assíncrona");
        });
        console.log("finalizado: " + nome);
      });
      return respNomeResultado; //extrai nao vazio e retorna reconstruído na quase* formatação inicial. *espaçamentos do tipo paragrafos sao perdidos :(
    }
  } catch (err) {
    console.error("Erro geral:", err);
  }
}

// Inicia o servidor na porta especificada
app.listen(port, () => {
  console.log(`Servidor da API rodando na porta ${port}`);
});
//----------------------------------------

const fs = require("fs");
const pastaDir = "./public";

var respNomeResultado = [];

var conteudoPorPaginaTratado;

var conteudoPorPaginaQuaseTratado;

const qtddPalavras = 30; //metade do que se espera

function funcaoAssincrona(callback) {
  let respostaCadaArquivo = daResposta(arquivo, nome); //passo o doc inteiro e o nome
  let objNaoNulo = extraiNaoVazio(respostaCadaArquivo);
  if (objNaoNulo.length != 0) {
    respNomeResultado.push(objNaoNulo);
  }
  callback();
}

function extraiNaoVazio(objeto) {
  let vetRespostas = [];
  for (const indice in objeto.achou) {
    let texto = objeto.achou[indice].trecho;
    let qtddTermoPag = Object.keys(texto).length;
    if (qtddTermoPag != 0) {
      vetRespostas.push(objeto.achou[indice]);
    }
  }
  return vetRespostas;
}

//recebo o doc inteiro e o nome
function daResposta(objJson, nome) {
  let resultado = [];
  // para cada pagina no documento
  for (let chave in objJson) {
    let conteudoPorPagina = objJson[chave]; //pego o conteudo da pagina
    conteudoPorPaginaTratado = processarTexto(conteudoPorPagina); //processo, separdo cada palavra e obtendo em um array de string
    let tamDaPagina = Object.keys(conteudoPorPaginaTratado).length;
    let indiceDaPesquisa = pesquisa(conteudoPorPaginaTratado); //encontro a palavra, indiceDaPesquisa=array de results
    let nPag = chave;
    let arrTrecho = [];
    if (indiceDaPesquisa.length > 0) {
      indiceDaPesquisa.forEach((indiceEncontrado) => {
        if (indiceEncontrado) {
          let trecho = " ";
          let limSup;
          if (indiceEncontrado < qtddPalavras) {
            limSup = qtddPalavras * 2;
            for (let i = 0; i < limSup && i < tamDaPagina; i++) {
              // trecho = trecho + " " + conteudoPorPaginaTratado[i];
              trecho = trecho + " " + conteudoPorPaginaQuaseTratado[i];
            }
          } else {
            let aux = indiceEncontrado - qtddPalavras;
            limSup = qtddPalavras * 2 + aux;
            for (let i = aux; i < limSup && i < tamDaPagina; i++) {
              trecho = trecho + " " + conteudoPorPaginaQuaseTratado[i];
              // trecho = trecho + " " + conteudoPorPaginaTratado[i];
            }
          }
          arrTrecho.push(trecho);
        }
      });
    }
    let push = { pagina: nPag, trecho: arrTrecho };
    resultado.push(push);
  }
  let retorno = { nome: nome, achou: resultado };
  return retorno; //objeto com nome e um vetor referente a cada linha(se encontrou ou nao)
}

function pesquisa(vetor) {
  let arr = [...vetor];
  let indices = [];
  if (arr.includes(termo)) {
    while (arr.includes(termo)) {
      let indc = arr.indexOf(termo);
      indices.push(indc);
      arr[indc] = "";
    }
  }
  return indices;
}

function processarTexto(texto) {
  const textoSemPontuacao = texto.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  const palavras = textoSemPontuacao.split(/\s+/);
  conteudoPorPaginaQuaseTratado = texto.split(/\s+/);
  const palavrasEmMinusculas = palavras.map((palavra) => palavra.toLowerCase());
  return palavrasEmMinusculas;
}
