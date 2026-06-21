import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, combineLatest, of } from 'rxjs';
import { map } from 'rxjs/operators';

export interface User {
  id?: string;
  nome: string;
  sobrenome: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
  email: string;
  senha: string;
  cep: string;
  endereco: string;
  complemento: string;
  tipoUsuario: 'paciente' | 'psicologo';
  foto?: string;
  especialidade?: string;
  crp?: string;
  descricao?: string;
  whatsapp?: string;
 instagram?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private firestore: AngularFirestore) { }

  // LOGIN
  async login(email: string, senha: string): Promise<boolean> {
    try {
      const snapshot = await this.firestore
        .collection('usuarios', ref =>
          ref.where('email', '==', email).where('senha', '==', senha)
        )
        .get()
        .toPromise();

      if (snapshot && !snapshot.empty) {
        const data = snapshot.docs[0].data() as User;
        const user: User = {
          id: snapshot.docs[0].id,
          ...data
        };

        console.log('Login successful:', user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
      } else {
        console.log('Login failed: Invalid credentials');
        return false;
      }

    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  // REGISTRO
  async register(userData: User): Promise<boolean> {
    try {
      // Verifica se email já existe
      const snapshot = await this.firestore
        .collection('usuarios', ref => ref.where('email', '==', userData.email))
        .get()
        .toPromise();

      if (snapshot && !snapshot.empty) {
        console.log('Registration failed: Email already exists');
        return false;
      }

      // Salva no Firebase
      await this.firestore.collection('usuarios').add({
        ...userData,
        criadoEm: new Date()
      });

      console.log('Registration successful:', userData);
      return true;

    } catch (error) {
      console.error('Erro no cadastro:', error);
      throw error;
    }
  }

  // LOGOUT
  logout(): void {
    localStorage.removeItem('currentUser');
  }

  // USUÁRIO ATUAL
  getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  // VERIFICA SE ESTÁ LOGADO
  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }

  async updateUser(user: any): Promise<void> {
    const snapshot = await this.firestore
      .collection('usuarios', ref => ref.where('email', '==', user.email))
      .get()
      .toPromise();

    if (!snapshot || snapshot.empty) {
      throw new Error('Usuário não encontrado.');
    }

    const docId = snapshot.docs[0].id;
    const updateData = { ...user };
    delete updateData.id;

    await this.firestore.collection('usuarios').doc(docId).update(updateData);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  async changePassword(email: string, currentSenha: string, novaSenha: string): Promise<boolean> {
    const snapshot = await this.firestore
      .collection('usuarios', ref =>
        ref.where('email', '==', email).where('senha', '==', currentSenha)
      )
      .get()
      .toPromise();

    if (!snapshot || snapshot.empty) {
      return false;
    }

    const docId = snapshot.docs[0].id;
    await this.firestore.collection('usuarios').doc(docId).update({ senha: novaSenha });

    const currentUser = this.getCurrentUser();
    if (currentUser?.email === email) {
      currentUser.senha = novaSenha;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    return true;
  }

  async resetPassword(email: string, novaSenha: string): Promise<boolean> {
    const snapshot = await this.firestore
      .collection('usuarios', ref => ref.where('email', '==', email))
      .get()
      .toPromise();

    if (!snapshot || snapshot.empty) {
      return false;
    }

    const docId = snapshot.docs[0].id;
    await this.firestore.collection('usuarios').doc(docId).update({ senha: novaSenha });

    const currentUser = this.getCurrentUser();
    if (currentUser?.email === email) {
      currentUser.senha = novaSenha;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    return true;
  }

  getUserByEmail(email: string): Observable<User | undefined> {
    return this.firestore
      .collection<User>('usuarios', ref => ref.where('email', '==', email))
      .valueChanges()
      .pipe(map(users => users[0]));
  }

  getUsersByEmails(emails: string[]): Observable<User[]> {
    if (!emails || emails.length === 0) {
      return of([]);
    }

    const chunks: string[][] = [];
    const chunkSize = 10;

    for (let i = 0; i < emails.length; i += chunkSize) {
      chunks.push(emails.slice(i, i + chunkSize));
    }

    const requests = chunks.map(chunk =>
      this.firestore.collection<User>('usuarios', ref => ref.where('email', 'in', chunk)).valueChanges()
    );

    return combineLatest(requests).pipe(map(results => results.flat()));
  }

  getPsicologos() {
    return this.firestore
      .collection('usuarios', ref =>
        ref.where('tipoUsuario', '==', 'psicologo')
      )
      .valueChanges();
  }
}