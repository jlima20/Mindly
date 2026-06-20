// src/app/pages/agendamento/agendar-consulta/agendar-consulta.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
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
  ) { }

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.email) {
      this.pacienteEmail = currentUser.email;
    } else {
      this.errorMessage = 'Usuário não logado ou e-mail não encontrado.';
      this.router.navigate(['/login']);
      return;
    }

    this.psicologoEmail = this.route.snapshot.paramMap.get('psicologoEmail');
    if (this.psicologoEmail) {
      this.loadPsicologoInfo(this.psicologoEmail);
    }

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
      const snapshot = await this.firestore.collection('usuarios', ref => ref.where('email', '==', email)).get().toPromise();
      if (snapshot && !snapshot.empty) {
        const psicologo = snapshot.docs[0].data() as User;
        this.psicologoNome = `${psicologo.nome} ${psicologo.sobrenome}`;
      } else {
        this.errorMessage = `Psicólogo com email ${email} não encontrado no banco de dados.`;
        const toast = await this.toastCtrl.create({ message: 'Psicólogo não encontrado. Verifique se foi selecionado corretamente.', duration: 3000, color: 'warning' });
        await toast.present();
      }
    } catch (error) {
      console.error('Erro ao carregar informações do psicólogo:', error);
      const toast = await this.toastCtrl.create({ message: 'Erro ao carregar informações do psicólogo.', duration: 3000, color: 'danger' });
      await toast.present();
    }
  }

  async agendar() {
    if (!this.psicologoEmail || !this.pacienteEmail || !this.dataConsulta || !this.horaConsulta) {
      const toast = await this.toastCtrl.create({ message: 'Preencha todos os campos obrigatórios.', duration: 3000, color: 'warning' });
      await toast.present();
      return;
    }

    this.isLoading = true;
    try {
      const dataHoraAgendamento = this.buildDateTime(this.dataConsulta, this.horaConsulta);
      if (!dataHoraAgendamento) throw new Error('Formato de data/hora inválido');

      const novoAgendamento: Agendamento = {
        pacienteEmail: this.pacienteEmail,
        psicologoEmail: this.psicologoEmail,
        dataHora: dataHoraAgendamento,
        duracaoMinutos: this.duracaoMinutos,
        status: 'agendada',
        observacoes: this.observacoes,
        criadoEm: new Date()
      };

      await this.agendamentoService.criarAgendamento(novoAgendamento);

      if (this.googleAuthorized) {
        try {
          const googleEvent = this.buildGoogleEvent(novoAgendamento);
          await this.googleCalendarService.createEvent(googleEvent);
          const calendarToast = await this.toastCtrl.create({ message: 'Evento criado também no Google Agenda.', duration: 2500, position: 'bottom', color: 'success' });
          await calendarToast.present();
        } catch (googleError: any) {
          console.error('Erro ao sincronizar com Google Calendar:', googleError);
          const calendarWarningToast = await this.toastCtrl.create({ message: 'Google Calendar: não foi possível sincronizar. Agendamento criado localmente.', duration: 5000, position: 'bottom', color: 'warning' });
          await calendarWarningToast.present();
        }
      }

      const toast = await this.toastCtrl.create({ message: '✅ Agendamento confirmado com sucesso!', duration: 2500, position: 'bottom', color: 'success' });
      await toast.present();
      this.router.navigate(['/proximas-consultas']);
    } catch (error: any) {
      console.error('Erro ao agendar:', error);
      const toast = await this.toastCtrl.create({ message: error?.message || 'Erro ao agendar consulta.', duration: 4000, color: 'danger' });
      await toast.present();
    } finally {
      this.isLoading = false;
    }
  }

  async conectarGoogleAgenda(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.isLoading || this.isConnecting) return;
    this.isConnecting = true;
    try {
      if (this.googleAuthorized) {
        this.googleCalendarService.logout();
        this.googleAuthorized = false;
      }

      const returnUrl = window.location.pathname + window.location.search;
      const loading = await this.toastCtrl.create({ message: 'Redirecionando para Google Calendar...', duration: 2000 });
      await loading.present();
      await this.googleCalendarService.authorize(returnUrl);
    } catch (error: any) {
      console.error('Erro ao iniciar autorização do Google Calendar:', error);
      const toast = await this.toastCtrl.create({ message: 'Não foi possível conectar ao Google Calendar.', duration: 4000, color: 'danger' });
      await toast.present();
    } finally {
      this.isConnecting = false;
    }
  }

  async desconectarGoogleAgenda() {
    this.googleCalendarService.logout();
    this.googleAuthorized = false;
    const toast = await this.toastCtrl.create({ message: 'Desconectado do Google Calendar. Você pode conectar com outra conta.', duration: 3000, color: 'success' });
    await toast.present();
  }

  private buildGoogleEvent(agendamento: Agendamento) {
    const start = new Date(agendamento.dataHora);
    const end = new Date(start.getTime() + agendamento.duracaoMinutos * 60000);

    return {
      summary: `Consulta com ${this.psicologoNome}`,
      description: agendamento.observacoes || 'Consulta agendada pelo app.',
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      attendees: [ { email: agendamento.pacienteEmail }, { email: agendamento.psicologoEmail } ]
    };
  }

  private buildDateTime(dateValue: string, timeValue: string): Date | null {
    if (!dateValue || !timeValue) return null;
    const cleanedDate = dateValue.trim();
    const cleanedTime = timeValue.trim();

    // se timeValue já for ISO
    if (/T/.test(cleanedTime) && !isNaN(new Date(cleanedTime).getTime())) return new Date(cleanedTime);

    // tentar combinar date + time
    const timeMatch = cleanedTime.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (!timeMatch) return null;

    try {
      const parts = cleanedDate.includes('/') ? cleanedDate.split('/') : cleanedDate.split('-');
      let day: number, month: number, year: number;
      if (parts.length === 3 && cleanedDate.includes('/')) {
        day = Number(parts[0]); month = Number(parts[1]); year = Number(parts[2]);
      } else {
        year = Number(parts[0]); month = Number(parts[1]); day = Number(parts[2]);
      }
      const dt = new Date(year, month - 1, day, Number(timeMatch[1]), Number(timeMatch[2]), Number(timeMatch[3] || '0'));
      return dt;
    } catch (e) {
      return null;
    }
  }

}
