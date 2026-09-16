import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
  ,
  // Ensure built assets reference the S3 website prefix so CloudFront requests
  // /website/assets/... which map to objects under the 'website/' key.
  base: '/website/'
})
