<?php

return [

    /*
    | Origem do NS Timer. O Conecta redireciona para {origem}/auth/conecta?token={jwt}.
    | Local: http://127.0.0.1:3333
    */
    'origin' => env('NSTIMER_ORIGIN', 'https://nstimer.novasemente.com.br'),

    /*
    | Segredo compartilhado (JWT HS256). O mesmo valor no ambiente do NS Timer.
    | Não gravar em frontend, repositório, log ou URL fora do próprio token.
    */
    'sso_secret' => env('CONECTA_SSO_SECRET'),

];
