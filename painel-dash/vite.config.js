import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        // Bibliotecas (React, gráficos, ícones) num arquivo próprio: mudam raramente, então o
        // navegador as mantém em cache entre publicações e só o código do DASH é baixado de novo.
        codeSplitting: {
          groups: [{ name: 'bibliotecas', test: /node_modules/ }],
        },
      },
    },
  },
})
