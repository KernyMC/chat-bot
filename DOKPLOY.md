# Configuración de Dokploy - Frontend Only

Este Dockerfile en la raíz del proyecto está configurado para deployar **solo el frontend** en Dokploy.

## Configuración en Dokploy

1. **Build Context**: `.` (raíz del proyecto - dejar por defecto)
2. **Dockerfile Path**: `Dockerfile` (dejar por defecto)
3. **Puerto interno**: `80`
4. **Branch**: `main` (o tu branch principal)

## ¿Qué hace este Dockerfile?

- Copia solo la carpeta `front-end/` del repositorio
- Instala dependencias con `npm ci`
- Hace build de React + Vite
- Sirve la aplicación con Nginx
- Incluye configuración de proxy para `/api/` hacia el backend

## Configurar el backend

En `front-end/nginx.conf` línea 22, ajusta la URL de tu backend:

```nginx
# Si el backend está en otro contenedor en Dokploy:
proxy_pass http://nombre-del-backend:8001/;

# Si el backend está en un servidor externo:
proxy_pass https://tu-api.ejemplo.com/;
```

## Build local

```bash
# Desde la raíz del proyecto
docker build -t frontend-app .
docker run -p 3000:80 frontend-app
```

Abre http://localhost:3000

## Estructura

```
D:\chatbot-ai-hackathon\
├── Dockerfile              ← Este archivo (para Dokploy)
├── .dockerignore          ← Excluye todo excepto front-end/
└── front-end/
    ├── nginx.conf         ← Configuración de Nginx
    ├── src/               ← Código fuente React
    ├── package.json       ← Dependencias
    └── Dockerfile         ← Alternativa: build desde front-end/ directamente
```

## Troubleshooting

### "no such file or directory: Dockerfile"
- Verifica que el **Build Context** sea `.` (raíz)
- Verifica que el **Dockerfile Path** sea `Dockerfile`

### El API no funciona
- Revisa `front-end/nginx.conf` línea 22
- Asegúrate que la URL del backend sea accesible desde el contenedor

### Build muy lento
- Es normal en el primer build (instala node_modules)
- Builds subsecuentes usan caché de Docker y son más rápidos
