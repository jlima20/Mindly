# Regras de segurança do Firestore

O banco deve ficar sempre fechado a acessos anônimos. As regras estão em
[`firestore.rules`](firestore.rules) e precisam ser publicadas manualmente:

1. Abra o Console do Firebase e selecione o seu projeto.
2. Vá em **Firestore Database → Regras**.
3. Cole o conteúdo de `firestore.rules` e clique em **Publicar**.

> **Status:** o projeto está migrando para o Firebase Authentication.
> Enquanto isso, as regras bloqueiam todo acesso. Depois da migração,
> o acesso será liberado por usuário autenticado, e cada pessoa só
> poderá ler e alterar os próprios dados.

Use dados fictícios em testes e nunca regras com `allow read, write: if true`.