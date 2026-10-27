<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

  <p align="center">Framework progresivo de <a href="http://nodejs.org" target="_blank">Node.js</a> para construir aplicaciones del lado del servidor eficientes y escalables.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
</p>

---

# 🚀 Backend API - NestJS

Servicio principal de API REST del backend desarrollado con **NestJS**, separado e independiente del módulo de extracción y scraping en Python.

---

## 📌 Contexto de la Estructura

Para mantener los entornos limpios y evitar conflictos de dependencias entre Node.js y Python, la carpeta `backend` principal está organizada en dos módulos aislados:

```text
backend/
├── backend-nestjs/     <-- API REST (NestJS / Node.js) - [ESTA CARPETA]
└── scrapping-python/   <-- Servicio de Scrapeo & Celery (Python)