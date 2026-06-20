import { getRuntimeEnvironment } from './environment.override';

// `runtime` pode vir vazio em ambientes locais; tratar como `any` para mesclar configurações opcionais
const runtime: any = getRuntimeEnvironment();

export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "AIzaSyDhf9IFSel5NJwUegWoSOKNFGSsAITNWSA",
    authDomain: "projetomobile-860f3.firebaseapp.com",
    projectId: "projetomobile-860f3",
    storageBucket: "projetomobile-860f3.firebasestorage.app",
    messagingSenderId: "1084781020290",
    appId: "1:1084781020290:web:9ba074b9d2e18b6db4e09b"
  },
  googleCalendar: {
    clientId: 'REPLACE_WITH_GOOGLE_CLIENT_ID',
    clientSecret: 'REPLACE_WITH_GOOGLE_CLIENT_SECRET',
    redirectUri: 'http://localhost:4200/google-oauth-callback',
    scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
    authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    apiBaseUrl: 'https://www.googleapis.com/calendar/v3',
    ...(runtime.googleCalendar || {})
  }
};