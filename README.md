# Artemis Frontend Overview


![](./docs/img/2_dashboard.png)

## System Architecture

The Artemis system consists of multiple interconnected components. The architecture is designed to provide a web-based interface for managing Ludus cybersecurity training ranges through an intuitive frontend application. Read more about its' components here - [Artemis Components Explained](./docs/components.md). 

## Developing

```bash
npm install
npm run dev
```

## Test Deployment

```bash
# change variables in .env
openssl rand -hex 32
npm install
npm run build
npm start
```