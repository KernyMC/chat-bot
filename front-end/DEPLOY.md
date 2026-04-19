# Deploy Frontend en Dokploy

Este documento explica cómo deployar el frontend en Dokploy.

## Archivos creados

- **Dockerfile**: Build multi-stage optimizado (Node.js → Nginx)
- **nginx.conf**: Configuración de Nginx con proxy para el backend
- **.dockerignore**: Excluye archivos innecesarios del build

## Configuración en Dokploy

### 1. Crear nuevo proyecto en Dokploy

1. Ve a tu dashboard de Dokploy
2. Crea un nuevo proyecto tipo "Docker"
3. Conecta tu repositorio Git

### 2. Configuración del build

**IMPORTANTE**: Hay dos Dockerfiles disponibles:

#### Opción A - Dockerfile en raíz (RECOMENDADO para Dokploy)
- **Ubicación**: `D:\chatbot-ai-hackathon\Dockerfile`
- **Build Context**: `.` (raíz del proyecto)
- **Dockerfile Path**: `Dockerfile`
- **Puerto interno**: `80`

Esta es la opción más simple para Dokploy, ya que usa la configuración por defecto.

#### Opción B - Dockerfile en front-end
- **Ubicación**: `D:\chatbot-ai-hackathon\front-end\Dockerfile`
- **Build Context**: `front-end`
- **Dockerfile Path**: `Dockerfile` (relativo al build context)
- **Puerto interno**: `80`

Usa esta opción si quieres tener el Dockerfile junto al código fuente.

### 3. Variables de entorno (opcional)

Si necesitas configurar la URL del backend de forma dinámica, puedes usar variables de entorno.

### 4. Configurar el proxy del backend

**IMPORTANTE**: En el archivo `nginx.conf`, ajusta la línea del proxy según tu setup:

```nginx
# Si tu backend está en otro contenedor Docker:
proxy_pass http://nombre-servicio-backend:8001/;

# Si tu backend está en un servidor externo:
proxy_pass https://tu-backend.com/;
```

## Build local (para testing)

### Opción A - Desde la raíz del proyecto (igual que Dokploy)
```bash
# Desde D:\chatbot-ai-hackathon\
docker build -t frontend-app .

# Correr localmente
docker run -p 3000:80 frontend-app
```

### Opción B - Desde la carpeta front-end
```bash
# Desde D:\chatbot-ai-hackathon\front-end\
docker build -t frontend-app .

# Correr localmente
docker run -p 3000:80 frontend-app
```

Luego abre http://localhost:3000

## Optimizaciones incluidas

✅ **Multi-stage build**: Imagen final ligera (~25MB)
✅ **Nginx Alpine**: Base mínima y segura
✅ **Gzip compression**: Respuestas comprimidas
✅ **Cache headers**: Assets cacheados por 1 año
✅ **Security headers**: X-Frame-Options, X-Content-Type-Options, etc.
✅ **React Router support**: Redirige todas las rutas a index.html
✅ **API Proxy**: Proxy `/api/*` al backend

## Troubleshooting

### El API no funciona en producción

Verifica la configuración del proxy en `nginx.conf`:
- La URL del backend debe ser accesible desde el contenedor
- Si usas Docker Compose/Dokploy, usa el nombre del servicio del backend

### Error 404 en rutas de React

El nginx.conf ya maneja esto con `try_files`. Verifica que esté correctamente copiado.

### Build falla por falta de memoria

En Dokploy, aumenta los límites de memoria del build.
