// Abre um link https público para o app do entregador (RNF14).
//
// O navegador do celular só libera a localização em https, e o entregador
// sai do Wi-Fi da loja e passa para os dados móveis. O túnel da Cloudflare
// (gratuito, sem conta) resolve os dois: cria um endereço
// https://….trycloudflare.com que leva ao app rodando neste computador.
//
// Uso: deixe "npm run iniciar" rodando e, em outro terminal, "npm run tunel".
// O link muda a cada vez que o túnel é aberto.
const { spawn } = require('node:child_process');

const PORTA_APP = process.env.PORTA_APP || 5174;
const COMANDO = process.env.CLOUDFLARED || 'cloudflared';

const INSTALAR = `
O programa "cloudflared" não foi encontrado. Instale uma vez:
  Windows:  winget install --id Cloudflare.cloudflared
  macOS:    brew install cloudflared
  Linux:    https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
Depois feche e abra o terminal e rode "npm run tunel" de novo.`;

const tunel = spawn(COMANDO, ['tunnel', '--no-autoupdate', '--url', `http://localhost:${PORTA_APP}`]);
let avisado = false;

// O cloudflared escreve o endereço no meio do log; procuramos por ele.
function procurarLink(dados) {
  const link = String(dados).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (!link || avisado) return;
  avisado = true;
  console.log(`
==================================================================
 App do entregador (https, de qualquer rede):

   ${link[0]}

 Abra esse link no celular do entregador. Deixe este terminal e o
 "npm run iniciar" abertos durante o expediente. Ctrl+C fecha o link.
==================================================================`);
}

tunel.stdout.on('data', procurarLink);
tunel.stderr.on('data', procurarLink);
tunel.on('error', (erro) => {
  if (erro.code === 'ENOENT') console.error(INSTALAR);
  else console.error('Não foi possível abrir o túnel:', erro.message);
  process.exit(1);
});
tunel.on('exit', (codigo) => {
  if (!avisado) console.error(`O túnel fechou antes de gerar o link (código ${codigo}). Verifique a internet.`);
  process.exit(codigo ?? 0);
});
process.on('SIGINT', () => tunel.kill());
