import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule, RouterLink] 
})
export class LoginPage {

  email: string = '';
  senha: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(private auth: AuthService, private router: Router) { }

  isFormValid(): boolean {
    return !!(this.email.trim() && this.senha && this.isValidEmail(this.email));
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async entrar() {
    if (!this.isFormValid()) {
      this.errorMessage = 'Por favor, preencha email e senha válidos.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const success = await this.auth.login(this.email, this.senha);
      if (success) {
        console.log('Login realizado com sucesso!');

        const user = this.auth.getCurrentUser();

console.log('TIPO:', user?.tipoUsuario);
console.log(user);

if (user?.tipoUsuario === 'paciente') {
  this.router.navigate(['/perfil-paciente']);
} else if (user?.tipoUsuario === 'psicologo') {
  this.router.navigate(['/perfil-psicologo']);
} else {
  this.router.navigate(['/home']);
}

      } else {
        this.errorMessage = 'Email ou senha incorretos.';
      }
    } catch (error) {
      this.errorMessage = 'Erro ao fazer login. Tente novamente.';
      console.error('Erro no login:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
