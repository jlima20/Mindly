import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Agendamento {
  id?: string;
  pacienteEmail: string;
  psicologoEmail: string;
  dataHora: Date;
  duracaoMinutos: number;
  status: 'agendada' | 'confirmada' | 'cancelada' | 'realizada';
  observacoes?: string;
  criadoEm: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AgendamentoService {

  constructor(private firestore: AngularFirestore) {}

  async criarAgendamento(agendamento: Agendamento): Promise<void> {
    const id = this.firestore.createId();

    const agendamentoParaSalvar = {
      ...agendamento,
      id,
      dataHora: agendamento.dataHora,
      criadoEm: new Date()
    };

    await this.firestore
      .collection('agendamentos')
      .doc(id)
      .set(agendamentoParaSalvar);
  }

  getAgendamentosPorUsuario(
    userEmail: string,
    tipoUsuario: 'paciente' | 'psicologo'
  ): Observable<Agendamento[]> {
    const campoFiltro =
      tipoUsuario === 'paciente'
        ? 'pacienteEmail'
        : 'psicologoEmail';

    return this.firestore
      .collection<Agendamento>('agendamentos', ref =>
        ref.where(campoFiltro, '==', userEmail)
      )
      .valueChanges({ idField: 'id' })
      .pipe(
        map(agendamentos =>
          agendamentos
            .map(ag => this.converterAgendamento(ag))
            .sort((a, b) => a.dataHora.getTime() - b.dataHora.getTime())
        )
      );
  }

  getProximosAgendamentos(
    userEmail: string,
    tipoUsuario: 'paciente' | 'psicologo'
  ): Observable<Agendamento[]> {
    const campoFiltro =
      tipoUsuario === 'paciente'
        ? 'pacienteEmail'
        : 'psicologoEmail';

    const agora = new Date();

    return this.firestore
      .collection<Agendamento>('agendamentos', ref =>
        ref.where(campoFiltro, '==', userEmail)
      )
      .valueChanges({ idField: 'id' })
      .pipe(
        map(agendamentos =>
          agendamentos
            .map(ag => this.converterAgendamento(ag))
            .filter(ag => ag.dataHora >= agora)
            .filter(ag => ag.status !== 'cancelada')
            .sort((a, b) => a.dataHora.getTime() - b.dataHora.getTime())
        )
      );
  }

  async atualizarStatusAgendamento(
    agendamentoId: string,
    status: Agendamento['status']
  ): Promise<void> {
    await this.firestore
      .collection('agendamentos')
      .doc(agendamentoId)
      .update({ status });
  }

  getAgendamento(
    agendamentoId: string
  ): Observable<Agendamento | undefined> {
    return this.firestore
      .collection<Agendamento>('agendamentos')
      .doc(agendamentoId)
      .valueChanges({ idField: 'id' })
      .pipe(
        map(ag =>
          ag ? this.converterAgendamento(ag) : undefined
        )
      );
  }

  getAgendaDiariaPsicologo(
    psicologoEmail: string,
    data: Date
  ): Observable<Agendamento[]> {
    const inicioDoDia = new Date(data);
    inicioDoDia.setHours(0, 0, 0, 0);

    const fimDoDia = new Date(data);
    fimDoDia.setHours(23, 59, 59, 999);

    return this.firestore
      .collection<Agendamento>('agendamentos', ref =>
        ref.where('psicologoEmail', '==', psicologoEmail)
      )
      .valueChanges({ idField: 'id' })
      .pipe(
        map(agendamentos =>
          agendamentos
            .map(ag => this.converterAgendamento(ag))
            .filter(ag =>
              ag.dataHora >= inicioDoDia &&
              ag.dataHora <= fimDoDia
            )
            .filter(ag => ag.status !== 'cancelada')
            .sort((a, b) => a.dataHora.getTime() - b.dataHora.getTime())
        )
      );
  }

  private converterAgendamento(ag: any): Agendamento {
    return {
      ...ag,
      dataHora: this.converterData(ag.dataHora),
      criadoEm: this.converterData(ag.criadoEm)
    };
  }

  private converterData(valor: any): Date {
    if (!valor) {
      return new Date();
    }

    if (valor instanceof Date) {
      return valor;
    }

    if (valor.toDate && typeof valor.toDate === 'function') {
      return valor.toDate();
    }

    return new Date(valor);
  }
}