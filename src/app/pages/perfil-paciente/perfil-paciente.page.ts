import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { firstValueFrom } from 'rxjs';

import { AuthService, User } from '../../services/auth.service';
import { AgendamentoService } from '../../services/agendamento.service';


@Component({
  selector: 'app-perfil-paciente',
  templateUrl: './perfil-paciente.page.html',
  styleUrls: ['./perfil-paciente.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ]
})
export class PerfilPacientePage implements OnInit {


  user: User | any = {

    nome: '',
    sobrenome: '',
    cpf: '',
    dataNascimento: '',
    telefone: '',
    email: '',
    senha: '',
    cep: '',
    endereco: '',
    complemento: '',
    tipoUsuario: 'paciente',
    foto: ''

  };


  currentPassword = '';
  newPassword = '';
  confirmPassword = '';


  newPhotoTemp: string | null = null;


  profileMessage = '';
  passwordMessage = '';


  isLoadingProfile = false;
  isLoadingPassword = false;


  showPasswordForm = false;
  editMode = false;
  showDatepicker = false;


  proximosAgendamentos: any[] = [];




  constructor(

    private authService: AuthService,

    private agendamentoService: AgendamentoService,

    private router: Router,

    private toastCtrl: ToastController

  ) {}





  ngOnInit(){

    this.carregarUsuario();

    this.carregarProximosAgendamentos();

  }






  carregarUsuario(){


    const currentUser =
    this.authService.getCurrentUser();



    if(!currentUser || !currentUser.email){

      this.router.navigate(['/login']);

      return;

    }





    this.authService
    .getUserByEmail(currentUser.email)
    .subscribe(user => {



      if(user){


        this.user = {

          ...currentUser,

          ...user

        };



        this.user.dataNascimentoIso =

        this.user.dataNascimento

        ? this.toIsoDate(this.user.dataNascimento)

        : '';

      }



    });


  }






  async carregarProximosAgendamentos(){


    const currentUser =
    this.authService.getCurrentUser();



    if(!currentUser?.email){

      return;

    }





    this.agendamentoService
    .getProximosAgendamentos(
      currentUser.email,
      'paciente'
    )
    .subscribe(async agendamentos => {



      const listaAtualizada:any[] = [];




      for(const agendamento of agendamentos){



        const psicologo =

        await firstValueFrom(

          this.authService.getUserByEmail(
            agendamento.psicologoEmail
          )

        );




        listaAtualizada.push({

          ...agendamento,


          psicologoNome:

          psicologo

          ? `${psicologo.nome} ${psicologo.sobrenome}`

          : 'Psicólogo',



          psicologoFoto:

          psicologo?.foto

          || 'assets/avatar.png',



          whatsapp:

          psicologo?.whatsapp

          || '',



          instagram:

          psicologo?.instagram

          || ''

        });



      }




      this.proximosAgendamentos =
      listaAtualizada;



    });


  }
    async salvarPerfil(){


    this.isLoadingProfile = true;

    this.profileMessage = '';



    if(this.user.dataNascimentoIso){


      this.user.dataNascimento =

      this.fromIsoDate(

        this.user.dataNascimentoIso

      );


    }




    try{


      await this.authService.updateUser(

        this.user

      );



      this.profileMessage =

      'Perfil atualizado com sucesso.';



      this.editMode = false;

      this.showDatepicker = false;



      await this.showToast(

        this.profileMessage

      );



    }catch(error){


      console.error(

        'Erro ao atualizar perfil:',

        error

      );


      this.profileMessage =

      'Não foi possível atualizar o perfil.';



    }finally{


      this.isLoadingProfile = false;


    }


  }







  async onFotoSelecionada(event:any){



    const file =

    event.target.files?.[0];



    if(!file){

      return;

    }




    const reader =

    new FileReader();




    reader.onload = ()=>{


      this.newPhotoTemp =

      reader.result as string;



    };




    reader.readAsDataURL(file);



  }








  async capturePhoto(){



    try{



      const image =

      await Camera.getPhoto({



        quality:80,


        allowEditing:false,


        resultType:

        CameraResultType.DataUrl,


        source:

        CameraSource.Camera



      });




      this.newPhotoTemp =

      image.dataUrl || '';



    }catch(error){


      console.error(

        'Erro ao capturar foto:',

        error

      );


    }


  }








  async pickPhotoFromGallery(){



    try{



      const image =

      await Camera.getPhoto({



        quality:80,


        allowEditing:false,


        resultType:

        CameraResultType.DataUrl,


        source:

        CameraSource.Photos



      });




      this.newPhotoTemp =

      image.dataUrl || '';




    }catch(error){


      console.error(

        'Erro ao selecionar foto:',

        error

      );


    }


  }








  async confirmarFoto(){



    if(!this.newPhotoTemp){

      return;

    }




    this.user.foto =

    this.newPhotoTemp;




    try{



      await this.authService.updateUser(

        this.user

      );




      this.newPhotoTemp = null;




      await this.showToast(

        'Foto atualizada com sucesso.'

      );




    }catch(error){



      console.error(

        'Erro ao salvar foto:',

        error

      );


    }



  }








  cancelarNovaFoto(){


    this.newPhotoTemp = null;


  }








  logout(){


    this.authService.logout();


    this.router.navigate([

      '/login'

    ]);


  }








  togglePasswordForm(){


    this.showPasswordForm =

    !this.showPasswordForm;


  }








  async alterarSenha(){



    this.isLoadingPassword = true;


    this.passwordMessage = '';




    if(this.newPassword !== this.confirmPassword){



      this.passwordMessage =

      'A nova senha e confirmação precisam ser iguais.';



      this.isLoadingPassword = false;


      return;


    }






    try{



      const success =

      await this.authService.changePassword(


        this.user.email,


        this.currentPassword,


        this.newPassword


      );





      if(success){



        this.passwordMessage =

        'Senha alterada com sucesso.';



        this.currentPassword = '';

        this.newPassword = '';

        this.confirmPassword = '';



        await this.showToast(

          this.passwordMessage

        );



      }else{



        this.passwordMessage =

        'Senha atual incorreta.';



      }




    }catch(error){



      console.error(

        'Erro ao alterar senha:',

        error

      );



      this.passwordMessage =

      'Não foi possível alterar a senha.';



    }finally{



      this.isLoadingPassword = false;



    }



  }
    toggleEditMode(){


    this.editMode =

    !this.editMode;



    if(!this.editMode){

      this.showDatepicker = false;

    }


  }







  verPsicologos(){


    this.router.navigate([

      '/lista-psicologos'

    ]);


  }







  verAgendamentos(){


    this.router.navigate([

      '/proximas-consultas'

    ]);


  }







  abrirWhatsapp(numero:string){



    if(!numero){

      return;

    }



    const link =

    `https://wa.me/${numero.replace(/\D/g,'')}`;



    window.open(

      link,

      '_blank'

    );


  }







  abrirInstagram(usuario:string){



    if(!usuario){

      return;

    }



    const link =

    `https://instagram.com/${usuario.replace('@','')}`;



    window.open(

      link,

      '_blank'

    );


  }







  toIsoDate(date:string):string{



    const [day, month, year] =

    date.split('/').map(Number);




    if(!day || !month || !year){

      return '';

    }




    return `${year.toString().padStart(4,'0')}-${month.toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`;



  }







  fromIsoDate(date:string):string{



    const [year, month, day] =

    date.split('-');




    return `${day}/${month}/${year}`;



  }







  async showToast(message:string){



    const toast =

    await this.toastCtrl.create({



      message,


      duration:2500,


      position:'bottom'



    });



    toast.present();



  }


}
