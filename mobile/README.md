# Mobile — Aplicativo do garçom (Flutter)

Aplicativo Flutter do garçom, consumindo a **mesma API NestJS** do painel web
(contrato: [`docs/contrato-api.md`](../docs/contrato-api.md)). Toda regra de negócio fica
no backend; o app só exibe dados e envia ações.

## Fluxo principal

1. **Login** com e-mail e senha (JWT da API). O token fica no armazenamento seguro do
   aparelho e a sessão é restaurada ao reabrir o app (`GET /auth/me`).
2. **Mesas**: livre, ocupada ou conta pedida. Tocar numa mesa livre abre uma comanda.
3. **Comanda**: pedidos com status, valores calculados pela API, entregar pedido pronto,
   cancelar pedido pendente e pedir a conta.
4. **Novo pedido**: cardápio disponível por categoria, quantidades, observação por item e
   do pedido; envio para a cozinha.
5. **Prontos**: pedidos que a cozinha terminou, com selo de contagem na navegação, para
   marcar como entregues.
6. **Sair** apaga o token. Se a API recusar o token (expirado, usuário desativado), o app
   volta ao login avisando.

Mesas, prontos e comanda se atualizam sozinhos a cada 15 s enquanto estão na tela, e
também com "puxar para atualizar".

## Requisitos

- Flutter 3.24 ou mais recente (Dart 3.5+)
- Backend rodando (veja [`backend/README.md`](../backend/README.md)) com o seed aplicado
- Emulador Android, celular Android ou Windows (desktop)

## Como executar

Na primeira vez, gere as pastas de plataforma (o repositório guarda só o código Dart; os
arquivos existentes não são sobrescritos):

```bash
cd mobile
flutter create . --project-name restaurante_garcom --org br.edu.restaurante --platforms=android,windows
flutter pub get
```

Depois:

```bash
flutter analyze        # análise estática
flutter test           # testes (usam respostas reais da API salvas em test/fixtures)
flutter run            # escolha o emulador/aparelho
```

### Endereço da API

| Onde o app roda | Endereço usado |
|---|---|
| Emulador Android | `http://10.0.2.2:3000/api` (automático; é o localhost do PC) |
| Windows (`flutter run -d windows`) | `http://localhost:3000/api` (automático) |
| Celular físico na mesma rede Wi-Fi | `flutter run --dart-define=API_URL=http://IP_DO_PC:3000/api` |

O endereço em uso aparece no rodapé da tela de login. No celular físico, libere a porta
3000 no firewall do Windows. O HTTP sem TLS é permitido somente na versão de debug
(`android/app/src/debug/AndroidManifest.xml`).

Usuários do seed (senha `senha123`): `joao@restaurante.local` e `maria@restaurante.local`
(garçons). Gerente e administrador também podem usar o app; o perfil Cozinha é orientado a
usar o painel web.

## Estrutura

```
mobile/lib/
├── main.dart                 # cria a sessão e restaura o token salvo
├── app.dart                  # MaterialApp + portão (login × telas internas)
├── tema.dart                 # paleta igual à do painel web
├── nucleo/
│   ├── api_client.dart       # ÚNICO ponto de acesso HTTP (token, erros, 401)
│   ├── api_exception.dart
│   ├── token_storage.dart    # JWT no armazenamento seguro
│   ├── config.dart           # URL da API (--dart-define=API_URL)
│   └── formato.dart          # moeda (centavos inteiros), horas
├── modelos/modelos.dart      # tipos das respostas da API
├── servicos/restaurante_api.dart   # endpoints usados pelo app
├── estado/sessao.dart        # estado global da sessão (ChangeNotifier + InheritedNotifier)
├── componentes/              # ConteudoAssincrono (carregando/erro/vazio/atualizar), selos, avisos
└── telas/                    # login, início (abas), mesas, comanda, novo pedido, prontos
```

Gerência de estado sem pacotes extras: `ChangeNotifier` para a sessão e estado local nas
telas. Dependências: `http` e `flutter_secure_storage`.

## Testes

- `modelos_test.dart`: conversão das respostas reais da API (login, mesas, cardápio,
  comanda, prontos).
- `api_client_test.dart`: token no cabeçalho, 401 encerrando a sessão, mensagens de erro da
  API (403 e 400), sem conexão.
- `sessao_test.dart`: login, perfil Cozinha recusado, restauração do token, token vencido,
  401 durante o uso, sair.
- `widget_test.dart`: validação do login, senha errada, login abrindo as mesas e logout.
- `formato_test.dart`: moeda e tempo decorrido.
