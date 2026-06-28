# Guia de Deploy - CEA EDUCAR

Esta guia documenta el flujo oficial para desplegar `CEA-EDUCAR` a produccion sin afectar otros proyectos del VPS.

## 1) Contexto de produccion (actual)

- VPS app path: `/var/www/cea-educar`
- API service: `cea-educar-api.service`
- API bind: `127.0.0.1:8011`
- Frontend publicado por nginx desde: `/var/www/cea-educar/frontend/dist`
- Dominio: `https://educardelcauca.com`

## 2) Flujo recomendado (resumen)

1. Validar build en local.
2. Commit + push a `main`.
3. Backup rapido en VPS.
4. Actualizar repo en VPS.
5. Build frontend en VPS.
6. Reiniciar solo servicio API de CEA.
7. Verificar salud (HTTP 200 + pruebas funcionales).

## 2.1) Arranque local (dev) - Backend y Frontend

Usar 2 terminales en tu PC.

### Terminal 1 - Backend (FastAPI)

```powershell
cd C:\Proyectos\CEA-EDUCAR\backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Si PowerShell bloquea la activacion:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Terminal 2 - Frontend (Vite)

```powershell
cd C:\Proyectos\CEA-EDUCAR\frontend
npm install
npm run dev
```

### Verificacion rapida local

- Frontend: `http://localhost:5173`
- API docs: `http://127.0.0.1:8000/docs`

### Detener servidores

- En cada terminal: `Ctrl + C`
- Para salir del venv: `deactivate`

## 3) Paso a paso

### A. Local (tu PC)

Desde `C:\Proyectos\CEA-EDUCAR\frontend`:

```powershell
npm ci
npm run build
```

Si todo pasa:

```powershell
cd ..
git add .
git commit -m "mensaje"
git push origin main
```

### B. VPS (produccion)

#### 1. Backup rapido antes de mover

```bash
TS=$(date +%F-%H%M)
sudo mkdir -p /var/www/backups/cea-educar/$TS
sudo cp -a /var/www/cea-educar/frontend/dist /var/www/backups/cea-educar/$TS/frontend-dist
echo "Backup: /var/www/backups/cea-educar/$TS"
```

#### 2. Actualizar codigo

```bash
sudo -u www-data -H bash -lc 'cd /var/www/cea-educar && git fetch origin && git reset --hard origin/main'
```

#### 3. Build frontend

```bash
sudo -u www-data -H bash -lc 'cd /var/www/cea-educar/frontend && npm ci && npm run build'
```

#### 4. Reiniciar API (solo CEA)

```bash
sudo systemctl restart cea-educar-api.service
sudo systemctl status cea-educar-api.service --no-pager -l
```

#### 5. Verificacion tecnica

```bash
curl -I https://educardelcauca.com
curl -sS https://educardelcauca.com | head -n 20
```

Esperado:

- `HTTP/2 200`
- `cea-educar-api.service` en `active (running)`
- `index.html` actualizado.

## 4) Checklist de humo (navegador)

- Login exitoso.
- Dashboard carga sin errores.
- Modulos clave: `Estudiantes`, `Caja`, `Caja Fuerte`, `Reportes`.
- Flujo rapido de pago o consulta de estudiante.

## 5) Problemas comunes y solucion

### Error `EACCES` al construir frontend

Corregir permisos y reconstruir:

```bash
sudo chown -R www-data:www-data /var/www/cea-educar/frontend
sudo rm -rf /var/www/cea-educar/frontend/dist
sudo -u www-data -H bash -lc 'cd /var/www/cea-educar/frontend && npm ci && npm run build'
```

### Errores de TypeScript bloquean deploy

No usar workaround en caliente si no es necesario. Primero corregir en local, validar `npm run build`, luego push y deploy normal.

### Sitio en 500 despues de deploy

Generalmente `dist` incompleto o ausente.

Restaurar rapido:

```bash
sudo rm -rf /var/www/cea-educar/frontend/dist
sudo cp -a /var/www/backups/cea-educar/<TS>/frontend-dist /var/www/cea-educar/frontend/dist
sudo chown -R www-data:www-data /var/www/cea-educar/frontend/dist
curl -I https://educardelcauca.com
```

## 6) Reglas de seguridad operativa

- No tocar otros `server_name` de nginx.
- No reiniciar servicios de otros proyectos.
- Limitar acciones a `/var/www/cea-educar` y `cea-educar-api.service`.
- Antes de cambios grandes, tomar backup.

## 7) Comando rapido (runbook compacto)

```bash
TS=$(date +%F-%H%M) && \
sudo mkdir -p /var/www/backups/cea-educar/$TS && \
sudo cp -a /var/www/cea-educar/frontend/dist /var/www/backups/cea-educar/$TS/frontend-dist && \
sudo -u www-data -H bash -lc 'cd /var/www/cea-educar && git fetch origin && git reset --hard origin/main' && \
sudo -u www-data -H bash -lc 'cd /var/www/cea-educar/frontend && npm ci && npm run build' && \
sudo systemctl restart cea-educar-api.service && \
sudo systemctl status cea-educar-api.service --no-pager -l && \
curl -I https://educardelcauca.com
```

## 8) Usuarios pruebas local
Usuario base por defecto (script backend/create_admin.py):

Email: admin@ceaeducar.com
Password inicial: admin123
Rol: ADMIN