import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AuthService } from 'src/app/services/auth.service';
import { AgendamentoService } from 'src/app/services/agendamento.service';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';


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


  user:any = {};

  pacientes:any[] = [];

  mostrarPacientes = false;

  editMode = false;

  showDatepicker = false;


  proximosAgendamentos:any[] = [];



  newPhotoTemp:string|null = null;



  isLoadingProfile = false;


  profileMessage = '';



  showPasswordForm = false;


  currentPassword = '';

  newPassword = '';

  confirmPassword = '';

  isLoadingPassword = false;

  passwordMessage = '';





  constructor(

    private auth:AuthService,

    private agendamentoService:AgendamentoService,

    private router:Router,

    private toastCtrl:ToastController

  ){}





  ngOnInit(){

    this.carregarUsuario();

  }






  carregarUsuario(){


    const currentUser =
    this.auth.getCurrentUser();



    if(!currentUser?.email){

      this.router.navigate(['/login']);

      return;

    }




    this.auth.getUserByEmail(
      currentUser.email
    )
    .subscribe(user=>{


      if(user){

        this.user={
          ...currentUser,
          ...user
        };


        this.carregarAgendamentos();

      }


    });



  }








  async carregarAgendamentos(){


    if(!this.user.email){

      return;

    }




    this.agendamentoService
    .getProximosAgendamentos(
      this.user.email,
      'psicologo'
    )
    .subscribe(async agendamentos=>{


      const lista:any[]=[];



      for(const agendamento of agendamentos){



        const paciente =
        await firstValueFrom(

          this.auth.getUserByEmail(
            agendamento.pacienteEmail
          )

        );



        lista.push({

          ...agendamento,


          pacienteNome:

          paciente ?

          `${paciente.nome} ${paciente.sobrenome}`

          :

          'Paciente',


          pacienteFoto:

          paciente?.foto ||

          'assets/avatar.png'


        });



      }



      this.proximosAgendamentos =
      lista;



    });


  }









  async salvarPerfil(){


    this.isLoadingProfile=true;



    try{


      await this.auth.updateUser(
        this.user
      );


      this.profileMessage =
      'Perfil atualizado com sucesso.';



      this.editMode=false;



      await this.showToast(
        this.profileMessage
      );



    }catch(error){


      console.error(error);


      this.profileMessage =
      'Erro ao atualizar perfil.';



    }
    finally{

      this.isLoadingProfile=false;

    }


  }







  async atualizarPerfil(){

    this.salvarPerfil();

  }








  async capturePhoto(){


    this.tirarFoto();


  }








  async tirarFoto(){


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



    }
    catch(error){

      console.error(error);

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



    }
    catch(error){

      console.error(error);

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



    reader.onload=()=>{


      this.newPhotoTemp =
      reader.result as string;


    };



    reader.readAsDataURL(file);


  }








  async confirmarFoto(){


    if(!this.newPhotoTemp){

      return;

    }



    this.user.foto =
    this.newPhotoTemp;



    await this.salvarPerfil();



    this.newPhotoTemp=null;



  }







  cancelarNovaFoto(){

    this.newPhotoTemp=null;

  }







  toggleEditMode(){

    this.editMode =
    !this.editMode;


  }









  verPsicologos(){

    this.router.navigate([
      '/lista-psicologos'
    ]);

  }






  verAgendamentos(){

    this.router.navigate([
      '/agenda-psicologo'
    ]);

  }








  carregarPacientes(){


    if(this.mostrarPacientes){

      this.mostrarPacientes=false;

      return;

    }



    this.agendamentoService
    .getAgendamentosPorUsuario(
      this.user.email,
      'psicologo'
    )
    .subscribe(agendamentos=>{


      const emails =
      [
        ...new Set(
          agendamentos.map(
            a=>a.pacienteEmail
          )
        )
      ];



      if(emails.length){


        this.auth.getUsersByEmails(
          emails
        )
        .subscribe(users=>{


          this.pacientes =
          users;


          this.mostrarPacientes=true;


        });


      }


    });


  }








  togglePasswordForm(){

    this.showPasswordForm =
    !this.showPasswordForm;


  }









 async alterarSenha(){


    this.isLoadingPassword=true;



    if(this.newPassword !== this.confirmPassword){


      this.passwordMessage =
      'As senhas não coincidem.';


      this.isLoadingPassword=false;

      return;

    }




    try{


      const sucesso =
      await this.auth.changePassword(

        this.user.email,

        this.currentPassword,

        this.newPassword

      );



      if(sucesso){


        this.passwordMessage =
        'Senha alterada com sucesso.';



        this.currentPassword='';

        this.newPassword='';

        this.confirmPassword='';


      }
      else{


        this.passwordMessage =
        'Senha atual incorreta.';


      }



    }
    finally{


      this.isLoadingPassword=false;


    }


  }







  abrirWhatsapp(numero:string){


    if(!numero){

      return;

    }


    window.open(

      `https://wa.me/${numero.replace(/\D/g,'')}`,

      '_blank'

    );


  }








  abrirInstagram(usuario:string){


    if(!usuario){

      return;

    }


    window.open(

      `https://instagram.com/${usuario.replace('@','')}`,

      '_blank'

    );


  }









  logout(){

    this.auth.logout();

    this.router.navigate(['/login']);

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