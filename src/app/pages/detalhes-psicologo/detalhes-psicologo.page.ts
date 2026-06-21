import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PsicologoService } from 'src/app/services/psicologo.service';

@Component({
  selector: 'app-detalhes-psicologo',
  templateUrl: './detalhes-psicologo.page.html',
  styleUrls: ['./detalhes-psicologo.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    RouterLink,
    CurrencyPipe
  ]
})
export class DetalhesPsicologoPage implements OnInit {

  psicologo: any | undefined;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private psicologoService: PsicologoService,
    private router: Router
  ) {}

  ngOnInit() {

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.carregarDetalhes(id);
    } else {
      this.isLoading = false;
    }

  }


  carregarDetalhes(id: string) {

    this.isLoading = true;

    this.psicologoService.obterPorId(id).subscribe({

      next: (data) => {

        this.psicologo = data;

        console.log('Dados do psicólogo:', this.psicologo);

        this.isLoading = false;

      },

      error: (error) => {

        console.error(
          'Erro ao carregar detalhes do psicólogo:',
          error
        );

        this.isLoading = false;

      }

    });

  }


  agendar() {

    if (this.psicologo && this.psicologo.email) {

      console.log(
        'Navegando para agendar com psicólogo:',
        this.psicologo.email
      );


      this.router.navigate([
        '/agendar-consulta',
        this.psicologo.email
      ]);

    } else {

      console.error(
        'Email do psicólogo não disponível'
      );

    }

  }


  abrirWhatsApp() {

    if (!this.psicologo?.whatsapp) {

      console.error(
        'WhatsApp do psicólogo não cadastrado'
      );

      return;

    }


    // remove caracteres como (), -, espaços
    const numero = this.psicologo.whatsapp
      .replace(/\D/g, '');


    const url =
      `https://wa.me/55${numero}`;


    window.open(
      url,
      '_blank'
    );

  }


  abrirInstagram() {

    if (!this.psicologo?.instagram) {

      console.error(
        'Instagram do psicólogo não cadastrado'
      );

      return;

    }


    let usuario = this.psicologo.instagram;


    // caso tenha colocado o link completo
    if (!usuario.startsWith('http')) {

      usuario =
        `https://instagram.com/${usuario.replace('@','')}`;

    }


    window.open(
      usuario,
      '_blank'
    );

  }

}