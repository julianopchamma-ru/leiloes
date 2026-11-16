#!/usr/bin/env python3
"""Consulta DJEN (Comunica PJe) - OAB 350793/SP, nome e processos monitorados.

Somente leitura. Serve para comparar com a rotina diária do Cowork.

Uso:
  python3 consulta_djen.py                       # dia útil anterior (segunda: sex-dom)
  python3 consulta_djen.py 2026-11-13 2026-11-16 # período explícito (disponibilização)
  python3 consulta_djen.py 2026-11-13 2026-11-16 --json saida.json
  python3 consulta_djen.py 2026-11-13 2026-11-16 --ids 784670702,785841933
      (--ids: ids já reportados pela rotina; mostra o que difere)

Só usa a biblioteca padrão. Se a API recusar a conexão (bloqueio por IP/região),
o script avisa que a consulta FALHOU; isso não significa ausência de publicações.
"""
import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, timedelta

BASE = "https://comunicaapi.pje.jus.br/api/v1/comunicacao"
OAB, UF = "350793", "SP"
NOME = "Juliano Parreira Chamma"
MONITORADOS = {
    "40010537520268260538": "Santa Cruz das Palmeiras (Juliano não é parte)",
    "40090714120268260003": "Hako - Blue Fisher",
    "40103116520268260003": "Hako - FG7",
    "40215921820268260003": "Hako - Sawafish",
    "40074481820268260010": "Hako - Gilson",
    "41754879620268260100": "Hako - Sicoob Copermec",
    "40243220220268260003": "Hako - Sea Gold (monitória)",
}
HEADERS = {"User-Agent": "Mozilla/5.0 (consulta-djen)", "Accept": "application/json"}


def periodo_padrao(hoje=None):
    hoje = hoje or date.today()
    if hoje.weekday() == 0:  # segunda: sexta a domingo
        return hoje - timedelta(days=3), hoje - timedelta(days=1)
    ontem = hoje - timedelta(days=1)
    return ontem, ontem


def get(params, tentativas=3):
    url = BASE + "?" + urllib.parse.urlencode(params)
    for i in range(tentativas):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except (urllib.error.URLError, TimeoutError) as e:
            if i == tentativas - 1:
                raise
            time.sleep(2 * (i + 1))


def busca(di, df, **filtro):
    itens, pagina = [], 1
    while True:
        j = get({"dataDisponibilizacaoInicio": di, "dataDisponibilizacaoFim": df,
                 "itensPorPagina": 100, "pagina": pagina, **filtro})
        lote = j.get("items") or []
        itens += lote
        if not lote or len(itens) >= j.get("count", 0):
            return itens
        pagina += 1


def limpa(texto):
    t = re.sub(r"<[^>]+>", " ", texto or "")
    return re.sub(r"\s+", " ", html.unescape(t)).strip()


def main():
    args = [a for a in sys.argv[1:]]
    saida_json = conhecidos = None
    if "--json" in args:
        i = args.index("--json"); saida_json = args[i + 1]; del args[i:i + 2]
    if "--ids" in args:
        i = args.index("--ids"); conhecidos = set(args[i + 1].split(",")); del args[i:i + 2]
    if len(args) >= 2:
        di, df = args[0], args[1]
    else:
        a, b = periodo_padrao()
        di, df = a.isoformat(), b.isoformat()

    buscas = {"OAB": {"numeroOab": OAB, "ufOab": UF}, "nome": {"nomeAdvogado": NOME}}
    buscas.update({f"proc {n}": {"numeroProcesso": n} for n in MONITORADOS})

    unicos, falhas = {}, []
    for nome, filtro in buscas.items():
        try:
            for it in busca(di, df, **filtro):
                unicos.setdefault(it["id"], it)
        except Exception as e:  # noqa: BLE001
            falhas.append(f"{nome}: {e}")

    if falhas:
        print("*** CONSULTA FALHOU (não significa ausência de publicações) ***")
        for f in falhas:
            print("  -", f)
        if len(falhas) == len(buscas):
            sys.exit(2)

    # elimina duplicidade por processo + data de disponibilização
    por_chave = {}
    for it in unicos.values():
        k = (it.get("numero_processo"), it.get("data_disponibilizacao"))
        por_chave.setdefault(k, it)
    itens = sorted(por_chave.values(),
                   key=lambda i: (i.get("data_disponibilizacao"), i.get("numero_processo")))

    print(f"Período (disponibilização): {di} a {df} | {len(itens)} publicações "
          f"(após eliminar duplicidades por processo + data)\n")
    saida = []
    for it in itens:
        proc = it.get("numero_processo", "")
        marca = MONITORADOS.get(proc)
        texto = limpa(it.get("texto"))
        advs = "; ".join((d.get("advogado") or {}).get("nome", "")
                         for d in it.get("destinatarioadvogados") or [])
        novo = "" if conhecidos is None else (
            "  [já na rotina]" if str(it["id"]) in conhecidos else "  [NÃO está na rotina]")
        print(f"- {it.get('numeroprocessocommascara', proc)} | {it.get('siglaTribunal')} | "
              f"{it.get('nomeOrgao')}{novo}")
        if marca:
            print(f"  >> MONITORADO: {marca}")
        print(f"  disp. {it.get('data_disponibilizacao')} | {it.get('tipoComunicacao')} - "
              f"{it.get('tipoDocumento')} | {it.get('nomeClasse')}")
        print(f"  advogados: {advs}")
        print(f"  {texto[:600]}{'…' if len(texto) > 600 else ''}")
        print(f"  {it.get('link')}\n")
        saida.append({"id": it["id"], "processo": proc, "disp": it.get("data_disponibilizacao"),
                      "tribunal": it.get("siglaTribunal"), "orgao": it.get("nomeOrgao"),
                      "tipo": it.get("tipoDocumento"), "texto": texto, "link": it.get("link")})

    if conhecidos is not None:
        achados = {str(i["id"]) for i in itens}
        # ids duplicados (mesmo processo+data) podem ter sido descartados: compara com todos
        achados |= {str(i) for i in unicos}
        print("Na rotina e não achados aqui:", sorted(conhecidos - achados) or "nenhum")
    if saida_json:
        with open(saida_json, "w", encoding="utf-8") as f:
            json.dump(saida, f, ensure_ascii=False, indent=2)
        print("JSON salvo em", saida_json)


if __name__ == "__main__":
    main()
