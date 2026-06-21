import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AgendamentoService } from 'src/app/services/agendamento.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-proximas-consultas',
  templateUrl: './proximas-consultas.page.html',
  styleUrls: ['./proximas-consultas.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ProximasConsultasPage implements OnInit {

  pacienteEmail: string = '';
  agendamentos: any[] = [];
  isLoading: boolean = true;

  constructor(
    private agendamentoService: AgendamentoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser || !currentUser.email) {
      this.router.navigate(['/login']);
      return;
    }

    if (currentUser.tipoUsuario !== 'paciente') {
      console.error('Acesso negado: somente pacientes podem ver esta página.');
      this.router.navigate(['/home']);
      return;
    }

    this.pacienteEmail = currentUser.email;
    this.carregarProximosAgendamentos();
  }

  carregarProximosAgendamentos() {
    this.isLoading = true;

    this.agendamentoService
      .getProximosAgendamentos(this.pacienteEmail, 'paciente')
      .subscribe({
        next: async (agendamentos) => {
          const listaAtualizada: any[] = [];

          for (const agendamento of agendamentos) {
            let psicologo: any = null;

            try {
              psicologo = await firstValueFrom(
                this.authService.getUserByEmail(agendamento.psicologoEmail)
              );
            } catch (error) {
              console.error('Erro ao buscar psicólogo:', error);
            }

            listaAtualizada.push({
              ...agendamento,

              psicologoNome: psicologo
                ? `${psicologo.nome || ''} ${psicologo.sobrenome || ''}`.trim()
                : agendamento.psicologoEmail,

              whatsapp: psicologo?.whatsapp || '',
              instagram: psicologo?.instagram || ''
            });
          }

          this.agendamentos = listaAtualizada;
          this.isLoading = false;
        },

        error: (error) => {
          console.error('Erro ao carregar agendamentos:', error);
          this.agendamentos = [];
          this.isLoading = false;
        }
      });
  }

  async cancelarAgendamento(agendamentoId: string) {
    if (!agendamentoId) {
      return;
    }

    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
      try {
        await this.agendamentoService.atualizarStatusAgendamento(
          agendamentoId,
          'cancelada'
        );

        this.carregarProximosAgendamentos();

      } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
      }
    }
  }

  abrirWhatsapp(numero: string) {
    if (!numero) {
      return;
    }

    const numeroLimpo = numero.replace(/\D/g, '');
    window.open(`https://wa.me/${numeroLimpo}`, '_blank');
  }

  abrirInstagram(usuario: string) {
    if (!usuario) {
      return;
    }

    const usuarioLimpo = usuario.replace('@', '');
    window.open(`https://instagram.com/${usuarioLimpo}`, '_blank');
  }

  formatarDataHora(dataHora: Date): string {
    return dataHora.toLocaleDateString('pt-BR') +
      ' às ' +
      dataHora.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
  }
}