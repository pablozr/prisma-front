import { Component, inject } from '@angular/core';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TextareaModule } from 'primeng/textarea';
import { HttpClient } from '@angular/common/http';
import { AppToastService } from '../../services/toast/app-toast.service';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-button-support',
  standalone: true,
  imports: [ButtonModule, InputTextModule, CardModule, CommonModule, FormsModule, InputTextModule, FloatLabelModule, TextareaModule, LoadingComponent],
  templateUrl: './button-support.component.html',
  styleUrl: './button-support.component.scss'
})
export class ButtonSupportComponent {
  private http = inject(HttpClient);
  private toast = inject(AppToastService);

  isOpen: boolean = false;
  isClicked: boolean = false;
  isProblem: boolean = false;
  isSugestion: boolean = false;

  userEmail: string = '';
  userProblem: string = '';
  userSugestion: string = '';

  isLoading: boolean = false;

  toggleOpen(){
    this.isClicked = false;
    this.isProblem = false;
    this.isSugestion = false;
    this.isOpen = !this.isOpen;
  }

  openInputArea(value: string){
    this.isClicked = true;
    if (value == 'problem'){
      this.isSugestion = false;
      this.isProblem = true;
    }
    if (value == 'sugestion'){
      this.isProblem = false;
      this.isSugestion = true;
    }
  }

  submitEmail(){
    console.log(this.userEmail)
    console.log(this.userProblem)
    console.log(this.userSugestion)

    if (this.userEmail){
      let htmlContent: string = '';
      if (this.userProblem){
        htmlContent = `<h1>O usuário com email ${this.userEmail} teve um problema</h1> <p>Segue a descrição do problema:</p> <p>${this.userProblem}</p>`
      } else if (this.userSugestion){
        htmlContent = `<h1>O usuário com email ${this.userEmail} enviou uma sugestão</h1> <p>Segue a sugestão:</p> <p>${this.userSugestion}</p>`
      } else{
        this.toast.error('Problema ou sugestao vazios', 'O campo de problema ou descricao deve ser preenchido.');
        return
      }
      this.isLoading = true;
      return new Promise((resolve, _) => {this.http.post('', {
        to: "",
        from: "",
        html: htmlContent,
        subject: "Problema/Sugestão",
        base64Attachment: '',
        base64AttachmentName: "documentation",
        message: "Segue a documento em anexo"
      }).subscribe({
        next: (data: any) => {
          // console.log(data);
          this.isOpen = false;
          this.isClicked = false;
          this.isProblem = false;
          this.isSugestion = false;
          this.isLoading = false;

          this.userEmail = '';
          this.userProblem = '';
          this.userSugestion = '';

          this.toast.success('Problema/sugestao enviada', 'Seu problema ou sugestao foi enviado com sucesso.');
        },
        error: (error: any) => {
          // console.log(error);
          this.isLoading = false;
          this.toast.error('Falha ao enviar', 'Tivemos um erro interno e nao foi possivel enviar as informacoes.', 6000);
        }
      })})
    } else{
      this.toast.error('Email vazio', 'O campo de email deve ser preenchido.');
      return
    }
  }
}
