Channel Player (Electron)
==========================
Esto es un proyecto base para reproducir canales desde un JSON usando Electron.

Instrucciones rápidas:
1. Instalar dependencias:
   npm install
   npm install --save-dev electron
2. Ejecutar:
   npm start

Notas:
- El reproductor carga el JSON desde:
  https://raw.githubusercontent.com/00levi/lista/refs/heads/main/channel.json
  Si ese enlace no funciona, reemplazalo en renderer.js por la URL raw correcta.

- El control Noga funciona en modo "teclado virtual" con la rueda/flechas.
  La app captura ArrowUp / ArrowDown para cambiar canales.
