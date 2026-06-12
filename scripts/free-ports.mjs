import { execSync } from 'node:child_process'

const PORTS = [3000, 3001, 3002]

function freePortWin(port) {
  try {
    const ps = `
      $conns = Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue
      $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
      foreach ($pid in $pids) {
        if ($pid -and $pid -ne 0) {
          Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
          Write-Output "killed $pid on ${port}"
        }
      }
    `
    const out = execSync(`powershell -NoProfile -Command "${ps.replace(/\n/g, ' ')}"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    if (out.trim()) console.log(`[free-ports] ${out.trim()}`)
  } catch {
    // puerto libre o sin permisos
  }
}

function freePortUnix(port) {
  try {
    execSync(`lsof -ti :${port} | xargs kill -9`, { stdio: 'ignore', shell: true })
    console.log(`[free-ports] liberado puerto ${port}`)
  } catch {
    // puerto libre
  }
}

if (process.platform === 'win32') {
  PORTS.forEach(freePortWin)
} else {
  PORTS.forEach(freePortUnix)
}
