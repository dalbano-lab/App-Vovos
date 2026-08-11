# 🧓 DoctorVovô

> "Cuidar com carinho também é tecnologia."

App Android humanizado para idosos — agenda, medicamentos, jogos cognitivos e área da família.

---

## 🚀 Como rodar localmente

### Pré-requisitos
- Python 3.10+
- Node.js 18+ e Yarn (`npm install -g yarn`)
- App **Expo Go** no celular Android

### 1. Clone o repositório
```bash
git clone https://github.com/dalbano-lab/App-Vovos.git
cd App-Vovos
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Opcional: adicione sua ANTHROPIC_API_KEY para identificação de remédios por foto
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
# Edite o .env e coloque o IP da sua máquina:
# EXPO_PUBLIC_BACKEND_URL=http://192.168.x.x:8000
yarn install
yarn start
# Escaneie o QR code com o app Expo Go no celular
```

---

## 📱 Telas

| Tela | Descrição |
|------|-----------|
| Onboarding | Cadastro: nome, foto, contato de emergência |
| Home | Saudação personalizada, agenda do dia, botão SOS |
| Remédios | Lista, adicionar por foto + IA, horários |
| Compromissos | Agenda de consultas e eventos |
| Jogos | Memória, Sequência, Perguntas — estimulação cognitiva |
| Família | Mensagens do cuidador com leitura por voz |
| Configurações | Editar perfil, apagar dados |

---

## 🏗️ Arquitetura

```
App-Vovos/
├── backend/           # FastAPI + SQLite (zero dependências externas)
│   ├── server.py      # API REST completa
│   ├── requirements.txt
│   └── .env.example
└── frontend/          # Expo React Native (Expo Go)
    ├── app/           # Telas (expo-router)
    ├── src/
    │   ├── api.ts     # Cliente HTTP
    │   ├── theme.ts   # Design tokens
    │   └── games/     # Jogos cognitivos
    └── package.json
```

## ✨ Funcionalidades
- 🗣️ **TTS em português** — leitura de telas por voz (expo-speech)
- 📸 **Identificação de remédio por IA** (Anthropic Claude Vision — opcional)
- 🚨 **Botão SOS** — liga direto pro contato de emergência
- 🧩 **3 jogos cognitivos** — Memória, Sequência, Perguntas
- 👨‍👩‍👧 **Área da família** — mensagens com leitura em voz
- 🔤 **Acessibilidade** — fontes grandes (22px+), botões grandes, alto contraste

## 📋 Endpoints da API

```
GET    /api/health
GET    /api/profile
PUT    /api/profile
DELETE /api/profile          (apaga todos os dados)

GET    /api/medications
POST   /api/medications
DELETE /api/medications/{id}
POST   /api/medications/identify  (IA por foto)

GET    /api/appointments
POST   /api/appointments
DELETE /api/appointments/{id}
PUT    /api/appointments/{id}/complete

GET    /api/family-messages
POST   /api/family-messages
DELETE /api/family-messages/{id}
```
