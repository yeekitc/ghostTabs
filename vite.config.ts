// // import { defineConfig } from 'vite'
// // import react from '@vitejs/plugin-react'

// // // https://vite.dev/config/
// // export default defineConfig({
// //   plugins: [react()],
// // })

// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   build: {
//     rollupOptions: {
//       input: {
//         main: './index.html',
//         background: './src/extension/background.ts',
//         content: './src/extension/content.ts',
//       },
//       output: {
//         entryFileNames: (chunkInfo) => {
//           if (chunkInfo.name === 'background') {
//             return 'background.js'
//           } else if (chunkInfo.name === 'content') {
//             return 'content.js'
//           } else {
//             return 'assets/[name]-[hash].js'
//           }
//         },
//         format: 'iife',
//       }
//     }
//   }
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        background: './src/extension/background.ts',
        content: './src/extension/content.ts',
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'background.js'
          } else if (chunkInfo.name === 'content') {
            return 'content.js'
          } else {
            return 'assets/[name]-[hash].js'
          }
        },
        inlineDynamicImports: false
      }
    }
  }
})