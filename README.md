# Artemis Frontend Overview

The Artemis system consists of multiple interconnected components. The architecture is designed to provide a web-based interface for managing Ludus cybersecurity training ranges through an intuitive frontend application. Read more about its' components here - [Artemis Components Explained](./docs/components.md). 


![](./docs/img/2_dashboard.png)

## Developing

```bash
npm install
npm run dev
```

## Test Deployment

To change variables in `.env` use:

```bash
openssl rand -hex 32
```

```bash
npm install
npm run build
npm start
```