const express = require("express");
const bodyParser = require("body-parser");
const cors=require("cors")
const app = express();
const port = 8080;

app.use(bodyParser.json());
app.use(cors({
  origin: 'localhost:8080/', // Substitua pelo endereço do seu site
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type,Authorization',
}));


app.get("/", (req, res) => {
  console.log("Response ok.");
  res.send("Ok – Servidor disponível.");
});

app.get("/buscar/:palavraChave", (req, res) => {
  const palavraChave = req.params.palavraChave;
  var resposta;
  respNomeResultado = [];
  console.log(palavraChave);
  termo=palavraChave;
  if (!palavraChave) {
    return res.status(400).json({
      error:
        'A solicitação deve incluir uma palavra chave para ser processada.',
    });
  }
  
  funcaoAssincrona1(() => {
    funcaoAssincrona2(() => {
      console.log('Antes da funcao extraiNaoVazio')
      resposta = extraiNaoVazio(respNomeResultado);
      console.log('Antes da funcao mandaResposta')
      mandaResposta(resposta);
    });
  });

  function mandaResposta(resposta) {
    console.log("Antes de mandar resposta")
    res.json(resposta);
    console.log("Depois de mandar resposta")
  }
});

function extraiNaoVazio(objetoResultado) {
  let temp = [];
  for (const resultado in objetoResultado) {
    let vetRespostas = [];
    let achou = false;
    let objeto = objetoResultado[resultado];
    for (const indice in objeto.achou) {
      let texto = objeto.achou[indice].trecho;
      let qtddTermoPag = Object.keys(texto).length;
      if (qtddTermoPag != 0) {
        vetRespostas.push(objeto.achou[indice]);
        achou = true;
      }
    }
    if (achou) {
      temp.push({ nome: objeto.nome, achou: vetRespostas });
    }
  }
  return temp;
}

// Inicia o servidor na porta especificada
app.listen(port, () => {
  console.log(`Servidor da API rodando na porta ${port}`);
});
//----------------------------------------

const fs = require("fs");
const pastaDir = "./pdfSaida - Copia";
// const pastaDir = "./testeJson";

// const termo = "2020";
var termo;
// const termo = "sustentável";

var respNomeResultado = [];

var conteudoPorPaginaTratado;

const qtddPalavras = 30; //metade do que se espera

function funcaoAssincrona1(callback) {
  fs.readdir(pastaDir, (err, arquivos) => {
    if (err) {
      console.error("Erro ao listar os arquivos: ", err);
      return;
    }
    arquivos.forEach((arquivo) => {
      if (arquivo.endsWith(".json")) {
        const arquivoDir = `${pastaDir}/${arquivo}`;
        fs.readFile(arquivoDir, "utf-8", (err, dados) => {
          if (err) {
            console.error(`Erro ao ler o arquivo ${arquivoDir}: `, err);
            return;
          } else {
            let objetoJSON = JSON.parse(dados); //converte a string recebida para json
            let respostaCadaArquivo = daResposta(objetoJSON, arquivo); //passo o doc inteiro e o nome
            respNomeResultado.push(respostaCadaArquivo);
            if (respNomeResultado.length == arquivos.length) {
              console.log('finaliza call back 1')
              callback();
            }
          }
        });
      }
    });
  });
}

function funcaoAssincrona2(callback) {
  // console.log(`Se isso aqui for igual a 202, aiai: ${respNomeResultado.length}`);
  callback();
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
              trecho = trecho + " " + conteudoPorPaginaTratado[i];
            }
          } else {
            let aux = indiceEncontrado - qtddPalavras;
            limSup = qtddPalavras * 2 + aux;
            for (let i = aux; i < limSup && i < tamDaPagina; i++) {
              trecho = trecho + " " + conteudoPorPaginaTratado[i];
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
  const palavrasEmMinusculas = palavras.map((palavra) => palavra.toLowerCase());
  return palavrasEmMinusculas;
}
