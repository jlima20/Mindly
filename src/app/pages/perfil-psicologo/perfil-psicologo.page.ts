import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from 'src/app/services/auth.service';
import { AgendamentoService } from 'src/app/services/agendamento.service';

@Component({
  selector: 'app-perfil-psicologo',
  templateUrl: './perfil-psicologo.page.html',
  styleUrls: ['./perfil-psicologo.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterLink
  ]
})
export class PerfilPsicologoPage implements OnInit {

  user: any = {};

  pacientes: any[] = [];
  mostrarPacientes = false;

  editMode = false;

  consultas: any[] = [];
  mostrarConsultas = true;

  newPhotoTemp: string | null = null;

  isLoadingProfile = false;
  profileMessage = '';

  showPasswordForm = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  isLoadingPassword = false;
  passwordMessage = '';

  constructor(
    private auth: AuthService,
    private agendamentoService: AgendamentoService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.carregarUsuario();
  }

  carregarUsuario() {
    const currentUser = this.auth.getCurrentUser();

    if (!currentUser?.email) {
      this.router.navigate(['/login']);
      return;
    }

    this.auth.getUserByEmail(currentUser.email).subscribe(user => {
      if (user) {
        this.user = {
          ...currentUser,
          ...user
        };

        this.carregarConsultas();
      }
    });
  }

  async carregarConsultas() {
    if (!this.user.email) {
      return;
    }

    this.agendamentoService
      .getAgendamentosPorUsuario(this.user.email, 'psicologo')
      .subscribe(async agendamentos => {
        const lista: any[] = [];

        for (const agendamento of agendamentos) {
          let paciente: any = null;

          try {
            paciente = await firstValueFrom(
              this.auth.getUserByEmail(agendamento.pacienteEmail)
            );
          } catch (error) {
            console.error('Erro ao buscar paciente:', error);
          }

          const dataHora = new Date(agendamento.dataHora);
          const consultaPassada = dataHora < new Date();

          lista.push({
            ...agendamento,

            pacienteNome: paciente
              ? `${paciente.nome || ''} ${paciente.sobrenome || ''}`.trim()
              : agendamento.pacienteEmail,

            pacienteFoto: paciente?.foto || 'assets/avatar.png',
            pacienteTelefone: paciente?.telefone || '',
            pacienteEmail: agendamento.pacienteEmail,

            consultaPassada,

            statusExibido: consultaPassada && agendamento.status !== 'cancelada'
              ? 'concluída'
              : agendamento.status
          });
        }

        this.consultas = lista;
      });
  }

  toggleConsultas() {
    this.mostrarConsultas = !this.mostrarConsultas;
  }

  togglePasswordForm() {
    this.showPasswordForm = !this.showPasswordForm;
  }

  async salvarPerfil() {
    this.isLoadingProfile = true;

    try {
      await this.auth.updateUser(this.user);

      this.profileMessage = 'Perfil atualizado com sucesso.';
      this.editMode = false;
      this.showPasswordForm = false;

      await this.showToast(this.profileMessage);

    } catch (error) {
      console.error(error);
      this.profileMessage = 'Erro ao atualizar perfil.';
    } finally {
      this.isLoadingProfile = false;
    }
  }

  async atualizarPerfil() {
    this.salvarPerfil();
  }

  async capturePhoto() {
    this.tirarFoto();
  }

  async tirarFoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      this.newPhotoTemp = image.dataUrl || '';

    } catch (error) {
      console.error(error);
    }
  }

  async pickPhotoFromGallery() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });

      this.newPhotoTemp = image.dataUrl || '';

    } catch (error) {
      console.error(error);
    }
  }

  async onFotoSelecionada(event: any) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      this.newPhotoTemp = reader.result as string;
    };

    reader.readAsDataURL(file);
  }

  async confirmarFoto() {
    if (!this.newPhotoTemp) {
      return;
    }

    this.user.foto = this.newPhotoTemp;
    await this.salvarPerfil();
    this.newPhotoTemp = null;
  }

  cancelarNovaFoto() {
    this.newPhotoTemp = null;
  }

  toggleEditMode() {
    this.editMode = !this.editMode;

    if (!this.editMode) {
      this.showPasswordForm = false;
      this.passwordMessage = '';
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
    }
  }

  carregarPacientes() {
    if (this.mostrarPacientes) {
      this.mostrarPacientes = false;
      return;
    }

    if (!this.user.email) {
      return;
    }

    this.agendamentoService
      .getAgendamentosPorUsuario(this.user.email, 'psicologo')
      .subscribe(agendamentos => {
        const emails = [
          ...new Set(
            agendamentos.map(a => a.pacienteEmail)
          )
        ];

        if (emails.length) {
          this.auth.getUsersByEmails(emails).subscribe(users => {
            this.pacientes = users;
            this.mostrarPacientes = true;
          });
        } else {
          this.pacientes = [];
          this.mostrarPacientes = true;
        }
      });
  }

  async alterarSenha() {
    this.isLoadingPassword = true;
    this.passwordMessage = '';

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordMessage = 'Preencha todos os campos da senha.';
      this.isLoadingPassword = false;
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordMessage = 'As senhas não coincidem.';
      this.isLoadingPassword = false;
      return;
    }

    try {
      const sucesso = await this.auth.changePassword(
        this.user.email,
        this.currentPassword,
        this.newPassword
      );

      if (sucesso) {
        this.passwordMessage = 'Senha alterada com sucesso.';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';

        await this.showToast(this.passwordMessage);
      } else {
        this.passwordMessage = 'Senha atual incorreta.';
      }

    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      this.passwordMessage = 'Erro ao alterar senha.';
    } finally {
      this.isLoadingPassword = false;
    }
  }

  formatarTelefoneVisual(telefone: string): string {
    const valor = telefone.replace(/\D/g, '');

    if (valor.length === 13 && valor.startsWith('55')) {
      return valor.replace(/55(\d{2})(\d{5})(\d{4})/, '+55 ($1) $2-$3');
    }

    if (valor.length === 11) {
      return valor.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }

    if (valor.length === 10) {
      return valor.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }

    return telefone;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'bottom'
    });

    await toast.present();
  }
}