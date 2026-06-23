import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },

  {
    path: 'home',
    loadComponent: () =>
      import('./home/home.page')
        .then(m => m.HomePage)
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/auth/login/login.page')
        .then(m => m.LoginPage)
  },

  {
    path: 'register',
    loadComponent: () =>
      import('./pages/auth/registro/registro.page')
        .then(m => m.RegistroPage)
  },

  {
    path: 'perfil-paciente',
    loadComponent: () =>
      import('./pages/perfil-paciente/perfil-paciente.page')
        .then(m => m.PerfilPacientePage)
  },

  {
    path: 'perfil-psicologo',
    loadComponent: () =>
      import('./pages/perfil-psicologo/perfil-psicologo.page')
        .then(m => m.PerfilPsicologoPage)
  },

  {
    path: 'lista-psicologos',
    loadComponent: () =>
      import('./pages/lista-psicologos/lista-psicologos.page')
        .then(m => m.ListaPsicologosPage)
  },

  {
    path: 'detalhes-psicologo/:id',
    loadComponent: () =>
      import('./pages/detalhes-psicologo/detalhes-psicologo.page')
        .then(m => m.DetalhesPsicologoPage)
  },

  {
    path: 'agendar-consulta/:psicologoEmail',
    loadComponent: () =>
      import('./pages/agendamento/agendar-consulta/agendar-consulta.page')
        .then(m => m.AgendarConsultaPage)
  },

  {
    path: 'proximas-consultas',
    loadComponent: () =>
      import('./pages/agendamento/proximas-consultas/proximas-consultas.page')
        .then(m => m.ProximasConsultasPage)
  },

  {
  path: 'agenda-psicologo',
  loadComponent: () =>
    import('./pages/agendamento/agenda-psicologo/agenda-psicologo.page')
      .then(m => m.AgendaPsicologoPage)
},

];