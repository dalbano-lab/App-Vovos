# DoctorVovô — Product Requirements Document

## Vision
A humanized, accessibility-first Expo React Native app (Brazilian Portuguese) that helps elderly users manage their daily routine: medications, appointments, family messages, and cognitive games — with large fonts, warm colors, native TTS, and a one-tap SOS emergency call.

> "Cuidar com carinho também é tecnologia."

## Target Users
- Elderly users (idosos)
- Family members and caregivers (used on the same device)
- Geriatric clinics / nursing homes

## MVP Scope (Implemented)

### Profile (local, no login)
- Single profile stored on backend with: full_name, called_as (how they want to be addressed, e.g., "Seu Antônio"), photo (base64), emergency contact (name + phone)
- 3-step onboarding: name → photo → emergency contact

### Home Dashboard
- Personalized greeting by time of day + chosen name ("Bom dia, Seu Antônio ☀️")
- Avatar with chosen photo
- "Ouvir minha agenda" (TTS) button reads the day summary
- Today's appointments + quick medication preview
- 4 quick-action cards (Remédios, Compromisso, Jogos, Família)
- Sticky SOS emergency button (dials emergency phone)

### Medications
- List with photo, dosage, instructions, schedule times
- Add screen with camera/gallery photo capture
- **AI Medication Identification**: photo → backend `/api/medications/identify` (gpt-5.1 vision) → fills name, dosage, instructions, suggested times
- Manual override of any field before saving
- Listen (TTS) and Delete actions per medication

### Appointments
- Add screen (title, date, time, location, notes)
- Today's appointments surfaced on home

### Cognitive Games (3)
- **Jogo da Memória**: card matching with 4/6/8 pair difficulty
- **Sequência Lógica**: Simon-style color sequence with TTS feedback
- **Perguntas Simples**: 5-question quiz with TTS read-aloud and visual feedback

### Área da Família
- Compose and store family messages (caregiver writes directly on elder's device)
- Newest-first list with Listen (TTS) and Remove

### Settings
- Edit profile name, called_as, emergency contact
- "Apagar todos os dados" wipes profile + meds + appointments + messages

### Accessibility & Design
- Earthy palette: Forest green primary `#2D5A4C`, terracotta secondary `#C25433`, cream background `#FDFBF7`
- Body text ≥ 22px, headings 28–42px
- Touch targets ≥ 60px height
- WCAG AAA contrast on body text
- Native TTS via `expo-speech` (pt-BR)
- High-contrast cards with soft shadows and rounded corners

## Tech Stack
- **Frontend**: Expo SDK 54, expo-router, React Native, expo-image-picker, expo-speech, @expo/vector-icons (Ionicons)
- **Backend**: FastAPI + Motor (async MongoDB), emergentintegrations LlmChat (OpenAI gpt-5.1 vision)
- **Storage**: MongoDB (single profile doc, separate collections for medications, appointments, family_messages)
- **Auth**: None — single local profile

## Future Enhancements
- Push notifications/alarms for medication and appointments (expo-notifications)
- Audio/video caregiver messages recorded in-app (expo-av recording)
- Multi-profile + caregiver remote login
- Font scale + high-contrast toggle in Settings
- Smartwatch integration
- Real-time emergency SOS with location sharing

## Smart Business Angle
**Freemium tier model**: Free includes profile + manual medications + simple games. Premium unlocks AI medication identification (per-scan limit), caregiver audio/video messages, advanced cognitive analytics & reports for family + clinics. B2B path: licensing to nursing homes ("Casas de Repouso") with multi-resident dashboards.
