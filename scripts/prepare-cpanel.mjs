import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const standaloneDir = path.join(root, '.next', 'standalone')
const deployDir = path.join(root, 'deploy')

function rimraf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(from, to)
    else fs.copyFileSync(from, to)
  }
}

if (!fs.existsSync(standaloneDir)) {
  console.error('[cpanel] Falta .next/standalone — corre: npm run build')
  process.exit(1)
}

rimraf(deployDir)
copyDir(standaloneDir, deployDir)
copyDir(path.join(root, '.next', 'static'), path.join(deployDir, '.next', 'static'))
copyDir(path.join(root, 'public'), path.join(deployDir, 'public'))

if (fs.existsSync(path.join(root, 'data'))) {
  copyDir(path.join(root, 'data'), path.join(deployDir, 'data'))
}

fs.writeFileSync(
  path.join(deployDir, 'CPANEL.txt'),
  `Animédula — despliegue cPanel (Node.js)

1. Sube TODO el contenido de esta carpeta a tu hosting
   (ej. /home/TU_USUARIO/animedula o public_html)

2. cPanel → Software → Setup Node.js App → Create Application
   - Node.js version: 18 o 20
   - Application mode: Production
   - Application root: carpeta donde subiste estos archivos
   - Application URL: tu dominio (ej. animedula.com)
   - Application startup file: server.js

3. Variables de entorno (en la misma pantalla de Node.js):
   NODE_ENV=production
   HOSTNAME=0.0.0.0
   PORT=(lo asigna cPanel — no lo cambies si ya viene)
   NEXT_PUBLIC_SITE_URL=https://TU-DOMINIO.com
   NEXT_PUBLIC_ADS_ENABLED=true
   NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-2157408985377179
   (+ slots de AdSense, Amazon, Mercado Libre, etc.)

4. Run NPM Install (si el panel lo pide) — en standalone suele no hacer falta.

5. Restart la aplicación Node.js

6. En AdSense usa la URL pública https://TU-DOMINIO.com (no localhost)

Archivo de arranque: server.js
`,
  'utf-8'
)

console.log('[cpanel] Paquete listo en: deploy/')
console.log('[cpanel] Comprime la carpeta deploy/ y súbela por Administrador de archivos o FTP')
