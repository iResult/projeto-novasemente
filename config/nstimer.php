<?php

return [

    /*
    | Origem do NS Timer. O Conecta redireciona para {origem}/auth/conecta?token={jwt}.
    | Local: http://127.0.0.1:3333
    */
    'origin' => env('NSTIMER_ORIGIN', 'https://nstimer.novasemente.com.br'),

    /*
    | Leitura pública do acompanhamento. O mesmo GET que a página /acompanhamento usa.
    */
    'live_path' => '/_api/schedule/live',

    /*
    | Segundos em que o Conecta reaproveita a última leitura, para a home e o poll
    | não martelarem o NS Timer.
    */
    'live_cache_seconds' => 8,

    /*
    | Segredo compartilhado (JWT HS256). O mesmo valor no ambiente do NS Timer.
    | Não gravar em frontend, repositório, log ou URL fora do próprio token.
    */
    'sso_secret' => env('CONECTA_SSO_SECRET'),

];
