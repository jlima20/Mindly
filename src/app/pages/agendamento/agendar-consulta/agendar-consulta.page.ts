import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { AgendamentoService, Agendamento } from 'src/app/services/agendamento.service';
import { AuthService, User } from 'src/app/services/auth.service';
import { GoogleCalendarService } from 'src/app/services/google-calendar.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-agendar-consulta',
  templateUrl: './agendar-consulta.page.html',
  styleUrls: ['./agendar-consulta.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AgendarConsultaPage implements OnInit {

  psicologoEmail: string | null = null;
  psicologoNome: string = '';
  pacienteEmail: string = '';

  dataConsulta: string = '';
  horaConsulta: string = '';

  duracaoMinutos: number = 50;
  observacoes: string = '';

  googleAuthorized: boolean = false;
  isLoading: boolean = false;
  isConnecting: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private agendamentoService: AgendamentoService,
    private authService: AuthService,
    private googleCalendarService: GoogleCalendarService,
    private firestore: AngularFirestore,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser || !currentUser.email) {
      this.errorMessage = 'Usuário não logado ou e-mail não encontrado.';
      this.router.navigate(['/login']);
      return;
    }

    if (currentUser.tipoUsuario !== 'paciente') {
      this.errorMessage = 'Apenas pacientes podem agendar consultas.';
      this.router.navigate(['/perfil-psicologo']);
      return;
    }

    this.pacienteEmail = currentUser.email;

    this.psicologoEmail = this.route.snapshot.paramMap.get('psicologoEmail');

    if (!this.psicologoEmail) {
      this.errorMessage = 'Psicólogo não informado na rota.';
      return;
    }

    this.loadPsicologoInfo(this.psicologoEmail);
    this.initGoogleCalendar();
  }

  private async initGoogleCalendar() {
    try {
      this.googleAuthorized = await this.googleCalendarService.ensureAuthorized();
    } catch (error: any) {
      console.error('Erro ao inicializar Google Calendar:', error?.message || error);
      this.googleAuthorized = false;
    }
  }

  async loadPsicologoInfo(email: string) {
    try {
      const snapshot = await this.firestore
        .collection('usuarios', ref => ref.where('email', '==', email))
        .get()
        .toPromise();

      if (snapshot && !snapshot.empty) {
        const psicologo = snapshot.docs[0].data() as User;
        this.psicologoNome = `${psicologo.nome || ''} ${psicologo.sobrenome || ''}`.trim();
      } else {
        this.errorMessage = `Psicólogo com email ${email} não encontrado.`;

        const toast = await this.toastCtrl.create({
          message: 'Psicólogo não encontrado.',
          duration: 3000,
          color: 'warning'
        });

        await toast.present();
      }

    } catch (error) {
      console.error('Erro ao carregar informações do psicólogo:', error);

      const toast = await this.toastCtrl.create({
        message: 'Erro ao carregar informações do psicólogo.',
        duration: 3000,
        color: 'danger'
      });

      await toast.present();
    }
  }

  async agendar() {
    if (this.isLoading) {
      return;
    }

    if (!this.psicologoEmail || !this.pacienteEmail || !this.dataConsulta || !this.horaConsulta) {
      const toast = await this.toastCtrl.create({
        message: 'Preencha data e hora da consulta.',
        duration: 3000,
        color: 'warning'
      });

      await toast.present();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const dataHoraAgendamento = this.buildDateTime(
        this.dataConsulta,
        this.horaConsulta
      );

      if (!dataHoraAgendamento || isNaN(dataHoraAgendamento.getTime())) {
        throw new Error('Data ou hora inválida.');
      }

      if (dataHoraAgendamento < new Date()) {
        throw new Error('Escolha uma data e hora futuras.');
      }

      const novoAgendamento: Agendamento = {
        pacienteEmail: this.pacienteEmail,
        psicologoEmail: this.psicologoEmail,
        dataHora: dataHoraAgendamento,
        duracaoMinutos: Number(this.duracaoMinutos) || 50,
        status: 'agendada',
        observacoes: this.observacoes || '',
        criadoEm: new Date()
      };

      console.log('AGENDAMENTO A SALVAR:', novoAgendamento);

      await this.agendamentoService.criarAgendamento(novoAgendamento);

      console.log('AGENDAMENTO SALVO NO FIREBASE');

      if (this.googleAuthorized) {
        try {
          const googleEvent = this.buildGoogleEvent(novoAgendamento);
          await this.googleCalendarService.createEvent(googleEvent);

          const calendarToast = await this.toastCtrl.create({
            message: 'Evento criado também no Google Agenda.',
            duration: 2500,
            position: 'bottom',
            color: 'success'
          });

          await calendarToast.present();

        } catch (googleError: any) {
          console.error('Erro ao sincronizar com Google Calendar:', googleError);

          const calendarWarningToast = await this.toastCtrl.create({
            message: 'Google Calendar: não foi possível sincronizar. Agendamento salvo no app.',
            duration: 5000,
            position: 'bottom',
            color: 'warning'
          });

          await calendarWarningToast.present();
        }
      }

      const toast = await this.toastCtrl.create({
        message: '✅ Agendamento confirmado com sucesso!',
        duration: 2500,
        position: 'bottom',
        color: 'success'
      });

      await toast.present();

      this.router.navigate(['/proximas-consultas']);

    } catch (error: any) {
      console.error('Erro ao agendar:', error);

      const toast = await this.toastCtrl.create({
        message: error?.message || 'Erro ao agendar consulta.',
        duration: 4000,
        color: 'danger'
      });

      await toast.present();

    } finally {
      this.isLoading = false;
    }
  }

  async conectarGoogleAgenda(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.isLoading || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      if (this.googleAuthorized) {
        this.googleCalendarService.logout();
        this.googleAuthorized = false;
      }

      const returnUrl = window.location.pathname + window.location.search;

      const loading = await this.toastCtrl.create({
        message: 'Redirecionando para Google Calendar...',
        duration: 2000
      });

      await loading.present();

      await this.googleCalendarService.authorize(returnUrl);

    } catch (error: any) {
      console.error('Erro ao iniciar autorização do Google Calendar:', error);

      const toast = await this.toastCtrl.create({
        message: 'Não foi possível conectar ao Google Calendar.',
        duration: 4000,
        color: 'danger'
      });

      await toast.present();

    } finally {
      this.isConnecting = false;
    }
  }

  async desconectarGoogleAgenda() {
    this.googleCalendarService.logout();
    this.googleAuthorized = false;

    const toast = await this.toastCtrl.create({
      message: 'Desconectado do Google Calendar.',
      duration: 3000,
      color: 'success'
    });

    await toast.present();
  }

  private buildGoogleEvent(agendamento: Agendamento) {
    const start = new Date(agendamento.dataHora);
    const end = new Date(start.getTime() + agendamento.duracaoMinutos * 60000);

    return {
      summary: `Consulta com ${this.psicologoNome || agendamento.psicologoEmail}`,
      description: agendamento.observacoes || 'Consulta agendada pelo app.',
      start: {
        dateTime: start.toISOString()
      },
      end: {
        dateTime: end.toISOString()
      },
      attendees: [
        { email: agendamento.pacienteEmail },
        { email: agendamento.psicologoEmail }
      ]
    };
  }

  private buildDateTime(dateValue: string, timeValue: string): Date | null {
    if (!dateValue || !timeValue) {
      return null;
    }

    const dateObj = new Date(dateValue);
    const timeObj = new Date(timeValue);

    if (!isNaN(dateObj.getTime()) && !isNaN(timeObj.getTime())) {
      return new Date(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate(),
        timeObj.getHours(),
        timeObj.getMinutes(),
        0
      );
    }

    const dateClean = dateValue.trim();
    const timeClean = timeValue.trim();

    const dateParts = dateClean.includes('/')
      ? dateClean.split('/')
      : dateClean.split('-');

    const timeMatch = timeClean.match(/(\d{1,2}):(\d{2})/);

    if (dateParts.length !== 3 || !timeMatch) {
      return null;
    }

    let day: number;
    let month: number;
    let year: number;

    if (dateClean.includes('/')) {
      day = Number(dateParts[0]);
      month = Number(dateParts[1]);
      year = Number(dateParts[2]);
    } else {
      year = Number(dateParts[0]);
      month = Number(dateParts[1]);
      day = Number(dateParts[2]);
    }

    return new Date(
      year,
      month - 1,
      day,
      Number(timeMatch[1]),
      Number(timeMatch[2]),
      0
    );
  }
}