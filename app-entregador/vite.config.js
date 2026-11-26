import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O app chama a API pelo próprio endereço (ex.: /app/rota) e o Vite repassa
// para a API na porta 3000. Assim um único link https (túnel) serve o app e a
// API, sem "conteúdo misto" (página https chamando API http), que o navegador
// bloqueia. Só as rotas do app (/app/...) passam: o despacho e a
// administração (/api/...) continuam acessíveis apenas no computador da loja.
const API = process.env.API_INTERNA || 'http://localhost:3000';
const servidor = {
  host: true, // abre pelo IP do computador (celular na mesma rede)
  // Endereços do túnel https (npm run tunel). O Vite recusa nomes de host
  // desconhecidos, como proteção; estes são os dos túneis que usamos.
  allowedHosts: ['.trycloudflare.com', '.ngrok-free.app'],
  proxy: { '^/app/': { target: API } },
};

export default defineConfig({
  plugins: [react()],
  server: { port: 5174, ...servidor },
  preview: { port: 4174, ...servidor },
});
