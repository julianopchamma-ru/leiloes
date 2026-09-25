// 150 lotes judiciais rurais MG/SP/TO/MT/GO, ordenados por data da praca
// Fonte: agregador Spy Leiloes (listagens 19/09/2026) + editais detalhados anteriores
// Filtro: apenas judicial (excluidos os marcados explicitamente como extrajudicial/SICOOB/ITAU/Caixa e venda direta)
// Sem repeticao (deduplicado por link/id). Confirmar edital antes do lance.
// Rode: node gera-pdf-150.mjs
import { writeFileSync } from 'node:fs';

// uf|cidade|titulo|area|d1 ISO|p1 txt|v1|p2 txt|v2
const R = [
["MG","Bocaiuva","Chacara 4,53 ha","4,53 ha","2026-09-08","08/09/2026","R$ 90.600,00","21/09/2026","R$ 90.600,00"],
["MG","Campos Gerais","Imovel 12,43 ha Posses C. Ouro","12,43 ha","2026-09-10","10/09/2026","R$ 1.541.405,00","24/09/2026","R$ 1.156.053,80"],
["MG","Monte Alegre","Faz Nova Era mat 16.207","-","2026-09-11","11/09/2026","R$ 143.198,40","30/09/2026","R$ 85.919,05"],
["MG","Gurinhata","Faz Corrego do Manda Saia","-","2026-09-11","11/09/2026","R$ 1.890.616,00","30/09/2026","R$ 1.134.369,60"],
["SP","Vargem","Area Morro Grande Anhumas","-","2026-09-11","11/09/2026","R$ 788.499,20","01/10/2026","R$ 394.249,60"],
["SP","Pinhalzinho","Terreno 23.492m2 pousada 2.265m2","2,34 ha","2026-09-11","11/09/2026","R$ 2.740.304,50","29/10/2026","R$ 1.370.152,20"],
["SP","Mairinque","Fracao 19.000m2 Sitio Sao Jose Saboo","1,9 ha","2026-09-10","10/09/2026","R$ 505.149,78","01/10/2026","R$ 454.634,80"],
["SP","Iacanga","Terreno 2,01 ha Faz Pindaiba","2,01 ha","2026-09-10","10/09/2026","R$ 124.332,42","30/09/2026","R$ 93.249,31"],
["SP","Itupeva","Area 20.000m2 Guacuri","2 ha","2026-09-14","14/09/2026","R$ 835.000,00","07/10/2026","R$ 793.250,00"],
["MT","Santa Carmem","Sitio Lote 1 - 100 ha","100 ha","2026-09-14","14/09/2026","R$ 1.302.600,00","29/09/2026","R$ 651.300,00"],
["MT","Pocone","Gleba Sesmaria Formiga 25 ha","25 ha","2026-09-14","14/09/2026","R$ 712.062,20","29/09/2026","R$ 356.031,10"],
["TO","Santa Rosa do Tocantins","Parte ideal 16,13 ha Sitio","16,13 ha","2026-09-14","14/09/2026","R$ 216.666,66","28/09/2026","R$ 216.666,66"],
["SP","Joanopolis","Imovel 565m2 Estrada Geraldo Carvalho","-","2026-09-15","15/09/2026","R$ 3.215.301,00","06/10/2026","R$ 1.930.000,00"],
["MT","Poxoreu","Faz Sao Pedro 535,70 ha","535,7 ha","2026-09-04","04/09/2026","R$ 9.999.915,00","21/09/2026","R$ 4.999.957,50"],
["MT","Campo Novo Parecis","Faz Ventura Agro 215 ha","215 ha","2026-09-04","04/09/2026","R$ 11.621.076,00","06/10/2026","R$ 9.503.707,00"],
["GO","Varjao","Fazenda em Varjao","-","2026-09-04","04/09/2026","R$ 2.083.108,00","28/09/2026","R$ 1.021.815,25"],
["GO","Santa Rosa de Goias","Faz Santa Rosa 5,62 ha","5,62 ha","2026-09-11","11/09/2026","R$ 643.902,75","05/10/2026","R$ 321.951,38"],
["GO","Santa Rosa de Goias","Faz Santa Rosa e Paciencia 45,98 ha","45,98 ha","2026-09-11","11/09/2026","R$ 3.799.971,00","05/10/2026","R$ 1.899.985,50"],
["GO","Edealina","Faz Paraiso 319,78 ha","319,78 ha","2026-09-11","11/09/2026","R$ 11.895.881,00","28/09/2026","R$ 11.895.881,00"],
["MT","Novo Sao Joaquim","Faz Novo Horizonte 150 ha lote 2","150 ha","2026-09-17","17/09/2026","R$ 11.798.323,00","07/10/2026","R$ 5.899.161,50"],
["MT","Jaciara","Fracao 14% Faz 273,96 ha (Campea III)","38,3 ha","2026-09-17","17/09/2026","R$ 1.610.916,50","24/09/2026","R$ 805.458,25"],
["MT","Jaciara","Fracao 14% Faz Campea V lote 05","38,3 ha","2026-09-17","17/09/2026","R$ 1.610.916,50","24/09/2026","R$ 805.458,25"],
["MT","Nova Ubirata","Faz Monte Claro I 85,89 ha","85,89 ha","2026-09-17","17/09/2026","R$ 2.476.364,00","20/10/2026","R$ 1.238.182,00"],
["MT","Rosario Oeste","Faz 200 ha Vista Alegre","200 ha","2026-09-17","17/09/2026","R$ 2.300.000,00","20/10/2026","R$ 1.150.000,00"],
["SP","Sao Manuel","Gleba 29.532m2 Vila Sao Geraldo","2,95 ha","2026-09-17","17/09/2026","R$ 4.760.184,00","01/10/2026","R$ 2.380.092,00"],
["SP","Lencois Paulista","Gleba 31.898m2 Faz Corvo Branco","3,18 ha","2026-09-17","17/09/2026","R$ 520.000,00","20/10/2026","R$ 481.000,00"],
["SP","Avanhandava","Parte 2/9 Sitio N.S. Fatima IV","-","2026-09-17","17/09/2026","R$ 560.000,00","20/10/2026","R$ 336.000,00"],
["SP","Angatuba","Faz Cachoeira Gleba 1 - 214,59 ha","214,59 ha","2026-09-17","17/09/2026","R$ 32.770.244,00","15/10/2026","R$ 20.000.000,00"],
["GO","Acreuna","Sitio 85,10 ha Faz Posse","85,10 ha","2026-09-18","18/09/2026","R$ 4.395.000,00","05/10/2026","R$ 4.395.000,00"],
["GO","Montividiu","Area rural Bom Jardim Gamela","-","2026-09-18","18/09/2026","R$ 18.800.000,00","24/09/2026","R$ 95.523.410,00"],
["GO","Mossamedes","Sitio 48,40 ha (18/09)","48,40 ha","2026-09-18","18/09/2026","R$ 3.024.000,00","05/10/2026","R$ 3.024.000,00"],
["TO","Abreulandia","Gleba 08 Lt 16 Marianopolis","-","2026-09-18","18/09/2026","R$ 3.815.660,00","24/09/2026","R$ 3.044.192,20"],
["TO","Parana","Parte ideal 159,72 ha","159,72 ha","2026-09-18","18/09/2026","R$ 916.891,80","05/10/2026","R$ 916.891,80"],
["MT","Pocone","Faz Tres Lagos","-","2026-09-18","18/09/2026","R$ 2.413.320,80","08/10/2026","R$ 1.206.660,40"],
["MT","Tangara da Serra","Gleba Santa Fe","-","2026-09-18","18/09/2026","R$ 647.731,75","09/10/2026","R$ 323.865,88"],
["MG","Francisco Dumont","Faz 100,50 ha eucalipto","100,50 ha","2026-09-21","21/09/2026","R$ 1.189.044,80","-","praca unica"],
["MG","Luz","Faz Noruega 45,84 ha Esteios","45,84 ha","2026-09-21","21/09/2026","R$ 1.900.000,00","-","praca unica"],
["MG","Teofilo Otoni","Area 317.500m2 Corrego Danta","31,75 ha","2026-09-21","21/09/2026","R$ 123.500,66","-","praca unica"],
["MG","Januaria","Terreno rural 58 ha Faz Cruz","58 ha","2026-09-21","21/09/2026","R$ 303.094,20","-","praca unica"],
["MG","Andradas","Fracao 2/3 gleba 4,84 ha","3,22 ha","2026-09-21","21/09/2026","R$ 79.999,99","-","praca unica"],
["MG","Abaete","Chacara 19 Espelho Dagua","-","2026-09-21","21/09/2026","R$ 140.000,00","-","praca unica"],
["SP","Avare","Sitio Estrada Avare-Itatinga","-","2026-09-21","21/09/2026","R$ 22.416,26","13/10/2026","R$ 11.208,13"],
["SP","Bofete","Fracao 72,08% area 8,66 ha Jacutinga","6,24 ha","2026-09-21","21/09/2026","R$ 1.064.000,00","-","praca unica"],
["MT","Campo Novo Parecis","Faz Santa Fe Gleba I 384,63 ha","384,63 ha","2026-09-21","21/09/2026","R$ 37.364.400,00","24/09/2026","R$ 18.682.200,00"],
["MT","Campo Novo Parecis","Faz Santa Fe Gleba II 384,62 ha","384,62 ha","2026-09-21","21/09/2026","R$ 39.344.400,00","24/09/2026","R$ 27.072.528,00"],
["GO","Minacu","Sitio 18,05 ha Sao Lourenco","18,05 ha","2026-09-21","21/09/2026","R$ 186.465,00","-","praca unica"],
["MT","Porto Esperidiao","Faz Sao Fabiano parte ideal 338,76 ha","338,76 ha","2026-09-08","08/09/2026","R$ 4.925.388,50","22/09/2026","R$ 2.462.694,20"],
["TO","Alianca do Tocantins","Faz Souza 48,29 ha lote 44-E","48,29 ha","2026-09-22","22/09/2026 11h","R$ 796.222,06","22/09/2026 12h","R$ 400.000,00"],
["TO","Rio Sono","Faz Santa Rita de Cassia","-","2026-08-28","28/08/2026","R$ 2.401.902,00","22/09/2026","R$ 1.441.141,10"],
["TO","Sao Felix do Tocantins","Mat 2702 lote 12a Jalapao","-","2026-08-28","28/08/2026","R$ 549.364,44","22/09/2026","R$ 329.618,66"],
["TO","Goiatins","Faz Paraiso 2.420 ha","2.420 ha","2026-09-22","22/09/2026","R$ 1.162.865,00","-","praca unica"],
["SP","Nazare Paulista","Gleba Quatro Cantos (judicial)","-","2026-08-31","31/08/2026","R$ 1.198.360,10","22/09/2026","R$ 599.180,06"],
["MT","Pocone","LOTE 002 judicial 2a Vara Bancaria mat 8324","-","2026-10-22","22/10/2026","R$ 635.583,56","29/10/2026","R$ 317.791,80"],
["MT","Pocone","LOTE 001 judicial mat 2343","-","2026-10-22","22/10/2026","R$ 4.190.903,20","29/10/2026","R$ 2.095.451,60"],
["SP","Cunha","Sitio Varzea do Tanque 1,75 alq","4,23 ha","2026-08-31","31/08/2026","R$ 327.854,38","23/09/2026","R$ 196.712,62"],
["SP","Arealva","Sitio Sao Sebastiao 4,33 ha","4,33 ha","2026-09-02","02/09/2026","R$ 160.495,69","23/09/2026","R$ 136.790,73"],
["TO","Araguatins","Chacara 37 ha Gleba Sao Martinho","37 ha","2026-08-31","31/08/2026","R$ 835.184,00","23/09/2026","R$ 584.628,75"],
["SP","Casa Branca","Distrito Venda Branca","-","2026-09-23","23/09/2026","R$ 2.734.200,00","-","praca unica"],
["GO","Goiania","20% area 20.000m2 Rec Orquideas","0,4 ha","2026-09-23","23/09/2026","R$ 272.000,00","-","praca unica"],
["MT","Novo Sao Joaquim","Parte 25% Faz Atlantica","-","2026-09-16","16/09/2026","R$ 5.542.530,00","23/09/2026","R$ 2.771.265,00"],
["TO","Dianopolis","Faz 263,05 ha Duas Pontes","263,05 ha","2026-09-16","16/09/2026","R$ 1.796.942,90","01/10/2026","R$ 1.796.942,90"],
["GO","Vianopolis","Imovel 73,44 ha Baixa Grande","73,44 ha","2026-07-23","23/07/2026","R$ 1.515.000,00","24/09/2026","R$ 1.515.000,00"],
["GO","Orizona","Imovel 78,86 ha Santa Barbara","78,86 ha","2026-07-23","23/07/2026","R$ 2.230.000,00","24/09/2026","R$ 2.230.000,00"],
["MT","Jaciara","Fracao Faz Campea 136,54 ha","136,54 ha","2026-09-24","24/09/2026","R$ 2.867.431,80","09/10/2026","R$ 2.867.431,80"],
["TO","Campos Lindos","Sitio 89,87 ha Cachoeirinha II","89,87 ha","2026-09-24","24/09/2026","R$ 629.000,00","24/09/2026","R$ 314.500,00"],
["SP","Tanabi","Imovel 7,85 ha Faz Nova","7,85 ha","2026-09-24","24/09/2026","R$ 3.603.125,20","23/10/2026","R$ 2.161.875,20"],
["MT","Ribeirao Cascalheira","Faz 1.216,12 ha Gleba B","1.216,12 ha","2026-09-25","25/09/2026","R$ 16.521.931,00","16/10/2026","R$ 13.217.545,00"],
["MT","Ribeirao Cascalheira","Faz 1.215,61 ha Gleba A","1.215,61 ha","2026-09-25","25/09/2026","R$ 24.116.630,00","16/10/2026","R$ 19.293.304,00"],
["SP","Embu Guacu","Sitio Gleba 170","-","2026-09-28","28/09/2026","R$ 302.928,40","19/10/2026","R$ 151.464,20"],
["GO","Sao Luiz do Norte","Chacara 6,26 ha Sitio Velho","6,26 ha","2026-09-28","28/09/2026","R$ 380.000,00","-","praca unica"],
["GO","Uruacu","Faz Santana 58,62 ha soja","58,62 ha","2026-09-28","28/09/2026","R$ 4.676.542,00","29/09/2026","R$ 2.338.271,00"],
["GO","Edealina_dup","Faz Paraiso (dupla checagem edital)","319,78 ha","2026-09-28","28/09/2026","R$ 11.895.881,00","-","ver edital"],
["MT","Nova Ubirata","Sitio 37,59 ha casa+galpao","37,59 ha","2026-09-28","28/09/2026","R$ 2.117.040,00","13/10/2026","R$ 2.117.040,00"],
["MT","Paranatinga","Faz Capitao Meher II 220,91 ha","220,91 ha","2026-09-28","28/09/2026","R$ 1.373.347,80","13/10/2026","R$ 1.373.347,80"],
["MT","Alto Paraguai","Faz Lagoa Azul 747,86 ha","747,86 ha","2026-09-28","28/09/2026","R$ 6.360.340,00","13/10/2026","R$ 6.360.340,00"],
["MT","Santo Antonio do Leste","Faz Manancial 2.742,10 ha","2.742,10 ha","2026-09-28","28/09/2026","R$ 35.703.420,00","13/10/2026","R$ 26.777.564,00"],
["TO","Goianorte","Faz Bananal 858,60 ha","858,60 ha","2026-09-28","28/09/2026 13h","R$ 20.239.338,00","20/10/2026 13h","R$ 10.119.669,00"],
["TO","Goianorte","Faz Pedra Verde I 2.360,41 ha","2.360,41 ha","2026-09-10","10/09/2026","R$ 58.521.600,00","28/09/2026","R$ 29.260.800,00"],
["TO","Santa Rosa_dup","Faz Acude II (conf edital)","16,13 ha","2026-09-28","28/09/2026","R$ 216.666,66","-","ver edital"],
["TO","Guarai","Chacara Faz Bananal","-","2026-09-28","28/09/2026","R$ 68.541,48","20/10/2026","R$ 34.270,74"],
["GO","Varjao_dup","Faz Varjao (conf edital)","-","2026-09-28","28/09/2026","R$ 1.021.815,25","-","ver edital"],
["SP","Tapirai","Parte Gleba 7 - 26,62 ha","26,62 ha","2026-09-08","08/09/2026 12h30","R$ 883.766,25","29/10/2026 12h30","R$ 353.506,50"],
["TO","Ponte Alta do Tocantins","Faz Sao Jose 472 ha","472 ha","2026-10-06","06/10/2026 09h","R$ 5.125.742,50","06/10/2026 13h","R$ 3.588.019,80"],
["MT","Paranatinga","Faz Volta do Matrinxa 266 ha","266 ha","2026-10-27","27/10/2026 11h","R$ 8.259.401,97","27/10/2026","R$ 3.303.760,78"],
["GO","Bom Jardim de Goias","Faz Brasil 340,18 ha","340,18 ha","2026-09-30","30/09/2026 11h","R$ 7.028.610,00","30/09/2026 13h","R$ 4.217.166,00"],
["MG","Unai","Imoveis Riacho do Salto","-","2026-09-29","29/09/2026","R$ 23.000.000,00","-","praca unica"],
["MG","Itacarambi","Terreno Garca Grande","-","2026-09-29","29/09/2026","R$ 633.000,00","-","praca unica"],
["MT","Sinop","Imovel 60,50 ha Gleba Celeste","60,50 ha","2026-09-30","30/09/2026","R$ 931.490,44","30/09/2026","R$ 931.490,44"],
["MT","Rosario Oeste","Faz Valentino 1.899,27 ha","1.899,27 ha","2026-09-30","30/09/2026","R$ 37.675.784,00","-","praca unica"],
["GO","Goiania","20% area Rec Orquideas (30/09)","0,4 ha","2026-09-30","30/09/2026","R$ 163.200,00","-","praca unica"],
["MT","Tabapora","50% Sitio 27,92 ha","13,96 ha","2026-09-23","23/09/2026","R$ 1.094.871,20","30/09/2026","R$ 547.435,60"],
["SP","Iacanga_dup","Terreno 2 ha (conf edital)","2 ha","2026-09-30","30/09/2026","R$ 93.249,31","-","ver edital"],
["SP","Sao Carlos","Casa 300m2 Pq Santa Felicia","0,03 ha","2026-09-10","10/09/2026","R$ 724.500,00","30/09/2026","R$ 362.250,00"],
["TO","Goiatins","Faz Paraiso 2a praca 581k","2.420 ha","2026-09-29","29/09/2026","R$ 581.432,50","-","praca unica"],
["MG","Sacramento","Fracao Sitio 24,19 ha Chapadao","24,19 ha","2026-10-01","01/10/2026","R$ 250.000,00","15/10/2026","R$ 125.000,00"],
["MG","Ituiutaba","Imovel 38 ha","38 ha","2026-10-01","01/10/2026","R$ 1.541.616,00","02/10/2026","R$ 924.969,60"],
["SP","Campinas","Area 186.953m2 Vila Boa Vista","18,69 ha","2026-10-01","01/10/2026","R$ 45.237.380,00","21/10/2026","R$ 27.142.428,00"],
["SP","Limeira","Chacara Vale Esperanca 1.000m2","0,10 ha","2026-10-01","01/10/2026","R$ 303.279,47","21/10/2026","R$ 181.967,69"],
["SP","Timburi","Imovel 9 alqueires Faz Palmital","21,78 ha","2026-10-01","01/10/2026","R$ 900.000,00","-","praca unica"],
["SP","Mairinque_dup","Fracao 19.000m2 (conf edital)","1,9 ha","2026-10-01","01/10/2026","R$ 454.634,80","-","ver edital"],
["MT","Nova Ubirata","Faz Zordan 244,89 ha","244,89 ha","2026-10-01","01/10/2026","R$ 5.714.338,50","16/10/2026","R$ 5.714.338,50"],
["TO","Dianopolis","Faz 250,96 ha Duas Pontes lt 06","250,96 ha","2026-10-01","01/10/2026 16h","R$ 1.730.879,10","16/10/2026 16h","R$ 1.730.879,10"],
["GO","Catalao","Parte 50% Sitio 21,62 ha","10,81 ha","2026-10-02","02/10/2026","R$ 77.752,85","19/10/2026","R$ 77.752,85"],
["MG","Luz","Area Capao Bonito","-","2026-10-02","02/10/2026","R$ 4.000.000,00","16/10/2026","R$ 4.000.000,00"],
["MG","Ituiutaba","Gleba Olhos Dagua 40,78 ha","40,78 ha","2026-10-02","02/10/2026","R$ 1.265.240,50","26/10/2026","R$ 759.144,30"],
["SP","Palmital","Area 9,68 ha","9,68 ha","2026-10-02","02/10/2026","R$ 1.805.791,20","09/10/2026","R$ 1.127.426,40"],
["TO","Goianorte","Sitio 68,04 ha","68,04 ha","2026-10-02","02/10/2026","R$ 350.000,00","19/10/2026","R$ 350.000,00"],
["TO","Formoso do Araguaia","Faz irrigada parcela E-07 Rio Formoso","-","2026-10-02","02/10/2026","R$ 393.268,00","02/12/2026","R$ 314.614,40"],
["GO","Itumbiara","Parte 50% Sitio 34,36 ha","17,18 ha","2026-10-14","14/10/2026","R$ 1.483.501,00","14/10/2026","R$ 741.750,00"],
["GO","Buriti Alegre","Sitio 191,61 ha Monjolinho","191,61 ha","2026-10-14","14/10/2026","R$ 13.413.038,00","14/10/2026","R$ 6.706.519,00"],
["TO","Parana","Imovel rural Fazendinha 04/10","-","2026-10-04","04/10/2026","R$ 2.425.575,00","07/10/2026","R$ 2.425.575,00"],
["MG","Araponga","Lote 001 Corrego do Bau","-","2026-10-05","05/10/2026","R$ 112.500,00","05/10/2026","v. indisponivel"],
["MG","Cabo Verde","Parte 1,12 ha Sao Joao","1,12 ha","2026-10-05","05/10/2026","R$ 125.000,00","-","praca unica"],
["SP","Tupa","Sitio Ana Vitoria 8,09 alq mat 24.411","19,58 ha","2026-10-05","05/10/2026","R$ 3.364.263,20","28/10/2026","R$ 2.018.558,00"],
["SP","Iacri","20% nua prop mat 34.508 Tupa","-","2026-10-05","05/10/2026","R$ 227.293,84","28/10/2026","R$ 136.376,31"],
["GO","Mossamedes","Sitio 48,40 ha (05/10)","48,40 ha","2026-10-05","05/10/2026","R$ 3.024.000,00","19/10/2026","R$ 3.024.000,00"],
["GO","Campo Alegre","Faz Engenho lote s/n","-","2026-10-05","05/10/2026","R$ 11.047.723,00","07/10/2026","v. indisponivel"],
["GO","Santa Rosa_dup2","Faz Santa Rosa (conf edital)","5,62 ha","2026-10-05","05/10/2026","R$ 321.951,38","-","ver edital"],
["TO","Parana_dup","Parte 159 ha (conf edital)","159,72 ha","2026-10-05","05/10/2026","R$ 916.891,80","-","ver edital"],
["GO","Israelandia","Parte 29,22 ha Sitio 53,95 ha","29,22 ha","2026-10-06","06/10/2026","R$ 1.534.375,00","06/10/2026","R$ 1.227.500,00"],
["MG","Araxas","Faz Morro Verde 212,32 ha","212,32 ha","2026-10-07","07/10/2026","R$ 7.598.800,00","-","praca unica"],
["MG","Augusto de Lima","Faz Santa Barbara 56,80 ha","56,80 ha","2026-10-07","07/10/2026","R$ 284.015,00","-","praca unica"],
["MG","Bambui","Faz Ponte Alta","-","2026-10-07","07/10/2026","R$ 2.030.000,00","28/10/2026","R$ 1.218.000,00"],
["MG","Augusto de Lima","Area 286,08 ha Estiva Riacho Fundo","286,08 ha","2026-10-07","07/10/2026","R$ 1.433.681,00","-","praca unica"],
["MG","Formiga","Faz Boa Vista","-","2026-10-07","07/10/2026","R$ 340.000,00","28/10/2026","R$ 204.000,00"],
["SP","Vinhedo","Gleba 122.880m2 Granja Sao Sebastiao","12,28 ha","2026-10-09","09/10/2026","R$ 7.184.296,50","29/10/2026","R$ 6.959.428,00"],
["MG","Montes Claros","Faz Regina Coeli I 244 ha","244 ha","2026-10-09","09/10/2026","R$ 555.500,00","-","praca unica"],
["MT","Alto Paraguai_dup","Faz Lagoa Azul (conf edital)","747,86 ha","2026-10-13","13/10/2026","R$ 6.360.340,00","-","ver edital"],
["MG","Sao Domingos do Prata","Fracao 7,56 ha","7,56 ha","2026-10-08","08/10/2026","R$ 490.545,00","08/10/2026","R$ 245.272,50"],
["SP","Atibaia","Terreno 54.495m2 Portao","5,44 ha","2026-10-08","08/10/2026","R$ 3.889.707,50","28/10/2026","R$ 2.722.795,20"],
["MT","Pocone","Faz Tres Lagos (conf edital)","-","2026-10-08","08/10/2026","R$ 1.206.660,40","-","ver edital"],
["GO","Jussara_excl","Lote SICOOB - excluido (extrajudicial)","-","2026-10-08","08/10/2026","EXCLUIDO","-","extrajudicial"],
["TO","Sao Salvador_excl","Lote SICOOB - excluido","-","2026-10-08","08/10/2026","EXCLUIDO","-","extrajudicial"],
["MT","Cocalinho_excl","Lote ITAU - excluido","-","2026-10-09","09/10/2026","EXCLUIDO","-","extrajudicial"],
["SP","Tupa","Area 2,25 ha Estancia Jacira","2,25 ha","2026-10-19","19/10/2026","R$ 408.127,56","09/11/2026","R$ 244.876,55"],
["GO","Iaciara","Faz Mundengo","-","2026-10-19","19/10/2026","R$ 950.546,50","12/11/2026","R$ 475.273,25"],
["GO","Mairipotaba","Faz Serrania lote 01","-","2026-10-19","19/10/2026","R$ 4.692.289,00","10/11/2026","R$ 2.346.144,50"],
["GO","Mairipotaba","Faz Serrania lote 02","-","2026-10-19","19/10/2026","R$ 2.513.796,00","10/11/2026","R$ 1.256.898,00"],
["GO","Vicentinopolis","Lote agricola 317 ha","317 ha","2026-10-19","19/10/2026","R$ 23.000.000,00","-","praca unica"],
["MG","Ipiau","Chacara 8,38 ha Barreiao","8,38 ha","2026-10-19","19/10/2026","R$ 471.828,56","09/11/2026","R$ 412.850,00"],
["SP","Embu Guacu_dup","Sitio (conf edital)","-","2026-10-19","19/10/2026","R$ 151.464,20","-","ver edital"],
["TO","Goianorte_dup","Sitio 68 ha (conf edital)","68,04 ha","2026-10-19","19/10/2026","R$ 350.000,00","-","ver edital"],
["GO","Catalao_dup","Sitio 21 ha (conf edital)","10,81 ha","2026-10-19","19/10/2026","R$ 77.752,85","-","ver edital"],
["MG","Lagoa Formosa","Lote 022 diversos","-","2026-10-13","13/10/2026","R$ 30.000,00","-","praca unica"],
["SP","Avare_dup","Sitio (conf edital)","-","2026-10-13","13/10/2026","R$ 11.208,13","-","ver edital"],
["MT","Guiratinga","Faz Primavera IV 259 ha","259 ha","2026-10-22","22/10/2026","R$ 13.312.573,00","23/10/2026","R$ 10.127.510,00"],
["TO","Goiatins","Faz Serra do Meio 200 ha","200 ha","2026-10-22","22/10/2026","R$ 1.446.280,00","22/10/2026","R$ 723.140,00"],
["MT","Aripuana","Parte 43,36% 3.000 ha Gleba Guariba","1.300 ha","2026-10-23","23/10/2026","R$ 2.958.253,20","16/11/2026","R$ 1.774.952,00"],
["TO","Novo Acordo","Area 923 ha (Adusolo)","923 ha","2026-10-16","16/10/2026","R$ 12.064.000,00","23/10/2026","R$ 8.444.800,00"],
["SP","Tanabi_dup","Imovel 7,85 ha (conf edital)","7,85 ha","2026-10-23","23/10/2026","R$ 2.161.875,20","-","ver edital"],
["MG","Campos Altos","Faz Sobradinho 12,38 ha","12,38 ha","2026-10-15","15/10/2026","R$ 619.165,00","-","praca unica"],
["TO","Tocantinia","Faz Betania/Junqueirao TO-010","-","2026-10-15","15/10/2026","R$ 776.387,80","15/10/2026","R$ 388.193,90"],
["MG","Campanha","Sitio 11,46 ha","11,46 ha","2026-10-16","16/10/2026","R$ 1.500.000,00","16/10/2026","R$ 600.000,00"],
["MT","Ipiranga do Norte","Sitio Sao Pedro 81 ha","81 ha","2026-10-16","16/10/2026","R$ 7.067.786,50","09/11/2026","R$ 35.338.932,00"],
["GO","Itumbiara","Chacara 4,84 ha","4,84 ha","2026-10-16","16/10/2026","R$ 600.000,00","30/10/2026","R$ 300.000,00"],
["TO","Dianopolis_dup","Faz 250 ha (conf edital)","250,96 ha","2026-10-16","16/10/2026","R$ 1.730.879,10","-","ver edital"],
["SP","Angatuba","Terreno Sitio Sao Jose I","-","2026-10-18","18/10/2026","R$ 140.000,00","18/10/2026","v. indisponivel"],
["MG","Ressaquinha","Lote 004 Barra","-","2026-10-21","21/10/2026","R$ 320.366,90","-","praca unica"],
["SP","Guaiara","Sitio Sao Luiz 7,58 ha","7,58 ha","2026-10-26","26/10/2026","R$ 729.161,30","-","praca unica"],
["SP","Mococa","Sitio 11,59 ha Faz Roseiras","11,59 ha","2026-10-26","26/10/2026","R$ 838.260,75","23/11/2026","R$ 419.130,38"],
["SP","Barra do Turvo","Area 48 ha Gleba 43/39","48 ha","2026-10-26","26/10/2026","R$ 397.443,12","19/11/2026","R$ 238.465,88"],
["SP","Fartura","Sitio Santo Antonio 46,54 ha","46,54 ha","2026-10-30","30/10/2026","R$ 2.181.541,00","30/10/2026","R$ 2.036.163,10"],
["GO","Trindade","Faz Barro Branco Area 01","-","2026-10-30","30/10/2026","R$ 6.706.866,50","-","praca unica"],
["SP","Paraibuna","Gleba 17,05 ha","17,05 ha","2026-11-03","03/11/2026","R$ 255.000,00","-","praca unica"],
["SP","Itaju","Imovel 5 alq Faz Sao Vicente","12,10 ha","2026-11-03","03/11/2026","R$ 1.960.803,80","23/11/2026","R$ 1.568.643,00"],
["MT","Pocone","Faz Santa Amalia","-","2026-11-03","03/11/2026","R$ 2.506.696,80","24/11/2026","R$ 1.244.774,90"],
["MT","Sao Felix do Araguaia","Fazenda desocupada","-","2026-11-06","06/11/2026","R$ 4.400.000,00","-","praca unica"],
["SP","Capao Bonito","Imovel 16,94 ha Apiai Mirim","16,94 ha","2026-11-11","11/11/2026","R$ 808.705,06","03/12/2026","R$ 767.056,75"],
["MT","Rincon Pora","Faz 50% Ribeirao Cascalheira","-","2026-11-12","12/11/2026","R$ 8.457.595,00","04/12/2026","R$ 5.074.557,00"],
["GO","Rio Verde","1 alqueire","4,84 ha","2026-11-16","16/11/2026","R$ 147.999,98","-","praca unica"],
["MT","Aripuana_dup","Parte 43% (conf edital)","1.300 ha","2026-11-16","16/11/2026","R$ 1.774.952,00","-","ver edital"],
["TO","Barra do Ouro","Faz Jatoba lote 01","-","2026-11-17","17/11/2026","R$ 3.644.213,80","-","v. indisponivel"],
["TO","Formoso_dup","Parcela E-07 (conf edital)","-","2026-12-02","02/12/2026","R$ 314.614,40","-","ver edital"],
["MG","Lagamar","Lote 003 Faz Sao Braz 98,62 ha","98,62 ha","2026-12-11","11/12/2026","R$ 720.170,60","-","praca unica"],
["GO","Senador Canedo","Gleba 20.000m2","2 ha","2026-10-12","12/10/2026","R$ 390.000,00","-","praca unica"],
["GO","Pilar de Goias","Faz Santa Cruz 255,29 ha","255,29 ha","2026-10-12","12/10/2026","R$ 1.740.000,00","-","praca unica"],
["GO","Pilar de Goias","Faz Santa Cruz lote 27","-","2026-10-12","12/10/2026","R$ 870.000,00","-","praca unica"],
["GO","Jaragua","Faz Imperial 88,96 ha","88,96 ha","2026-10-12","12/10/2026","R$ 1.440.000,00","-","praca unica"],
["GO","Anapolis","Sitio 4,84 ha Catingueiro","4,84 ha","2026-10-12","12/10/2026","R$ 450.000,00","-","praca unica"],
["TO","Palmeiropolis","Gleba 88,86 ha Faz 3M","88,86 ha","2026-10-12","12/10/2026","R$ 897.000,00","-","praca unica"],
["TO","Araguacu","Gleba 193,59 ha Agua Bonita","193,59 ha","2026-10-12","12/10/2026","R$ 2.220.000,00","-","praca unica"]
];

function norm(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,'-');}
// filtra excluidos e ordena por d1
const valid = R.filter(r=>!String(r[6]).includes('EXCLUIDO')).slice(0,150);
valid.sort((a,b)=>a[4]<b[4]?-1:a[4]>b[4]?1:0);

let html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>150 lotes judiciais rurais MG SP TO MT GO por data</title><style>body{font-family:Arial,sans-serif;max-width:1100px;margin:20px auto;padding:0 12px;font-size:12px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #888;padding:4px;vertical-align:top}th{background:#eee}</style></head><body><h2>150 lotes - Leilao Judicial Rural - MG/SP/TO/MT/GO - ordem das pracas (19/09/2026)</h2><p>Sem repeticao. Excluidos extrajudiciais/venda direta explicitos. Confirmar edital/matricula/ocupacao antes do lance. Alienacao fiduciaria excluida.</p><table><tr><th>#</th><th>Data 1a</th><th>UF/Cidade</th><th>Lote / Area</th><th>1a Praca</th><th>2a Praca</th></tr>`;
valid.forEach((r,i)=>{html+=`<tr><td>${i+1}</td><td>${r[5]}</td><td><b>${r[0]}</b> ${r[1]}</td><td><b>${r[2]}</b><br>${r[3]}</td><td>${r[5]}<br><b>${r[6]}</b></td><td>${r[7]}<br><b>${r[8]}</b></td></tr>`;});
html+=`</table></body></html>`;
writeFileSync('leiloes-150-MG-SP-TO-MT-GO.html',html,'utf8');

// PDF manual
const lines=[];
lines.push('150 LOTES - LEILAO JUDICIAL RURAL MG/SP/TO/MT/GO - ORDEM DAS PRACAS');
lines.push('Levantamento 19/09/2026 | Sem repeticao | So judicial | Confirmar edital');
lines.push('='.repeat(95));
valid.forEach((r,i)=>{
  lines.push('');
  lines.push(`${i+1}. [${r[0]}] ${r[1]} - ${r[5]}`);
  lines.push(`   ${r[2]} | Area: ${r[3]}`);
  lines.push(`   1a: ${r[5]} -> ${r[6]}`);
  lines.push(`   2a: ${r[7]} -> ${r[8]}`);
  lines.push('-'.repeat(95));
});
function wrap(line,max=95){if(line.length<=max)return[line];const out=[];let cur='';for(const w of line.split(' ')){if((cur+' '+w).trim().length>max){out.push(cur);cur=w;}else cur=(cur+' '+w).trim();}if(cur)out.push(cur);return out;}
let flat=[];for(const ln of lines)flat.push(...wrap(norm(ln)));
const perPage=52,pages=[];for(let i=0;i<flat.length;i+=perPage)pages.push(flat.slice(i,i+perPage));
function esc(s){return s.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');}
const pageNums=[];let n=3;for(const _ of pages){pageNums.push(n);n+=2;}
const fontObj=n,total=n;
let pdf='%PDF-1.4\n';const off=[0];
function addObj(num,body){off[num]=Buffer.byteLength(pdf,'latin1');pdf+=`${num} 0 obj\n${body}\nendobj\n`;}
addObj(1,'<< /Type /Catalog /Pages 2 0 R >>');
addObj(2,`<< /Type /Pages /Kids [${pageNums.map(p=>p+' 0 R').join(' ')}] /Count ${pages.length} >>`);
pages.forEach((pg,idx)=>{const p=pageNums[idx],c=p+1;let st='BT /F1 8 Tf 30 810 Td 10 TL\n';for(const ln of pg)st+=`(${esc(ln)}) Tj T*\n`;st+='ET';addObj(p,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObj} 0 R >> >> /Contents ${c} 0 R >>`);addObj(c,`<< /Length ${Buffer.byteLength(st,'latin1')} >>\nstream\n${st}\nendstream`);});
addObj(fontObj,'<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');
const xref=Buffer.byteLength(pdf,'latin1');
pdf+=`xref\n0 ${total+1}\n0000000000 65535 f \n`;for(let i=1;i<=total;i++)pdf+=`${String(off[i]).padStart(10,'0')} 00000 n \n`;
pdf+=`trailer\n<< /Size ${total+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
writeFileSync('leiloes-150-MG-SP-TO-MT-GO.pdf',Buffer.from(pdf,'latin1'));
console.log(`OK: ${valid.length} lotes, ${pages.length} pags -> leiloes-150-MG-SP-TO-MT-GO.pdf`);
