#!/usr/bin/env python3
"""A Lenda da Caverna Perdida — jogo de aventura em texto."""

import sys
import textwrap


def escreva(texto):
    print(textwrap.fill(texto, width=78))


def titulo(texto):
    print("\n" + "=" * 78)
    print(texto.center(78))
    print("=" * 78)


SALAS = {
    "entrada": {
        "nome": "Entrada da Floresta",
        "descricao": (
            "Você está na entrada de uma floresta densa. O ar é úmido e "
            "ouve-se o canto distante de pássaros. Há uma trilha ao norte "
            "e uma cabana abandonada ao leste."
        ),
        "saidas": {"norte": "trilha", "leste": "cabana"},
        "itens": [],
    },
    "cabana": {
        "nome": "Cabana Abandonada",
        "descricao": (
            "A cabana está coberta de poeira. Há uma mesa quebrada no canto "
            "e uma lareira apagada. Algo brilha entre as cinzas."
        ),
        "saidas": {"oeste": "entrada"},
        "itens": ["chave enferrujada", "tocha"],
    },
    "trilha": {
        "nome": "Trilha da Floresta",
        "descricao": (
            "A trilha serpenteia entre árvores altíssimas. Ao norte você "
            "ouve o som de água corrente. A oeste, a trilha leva a uma "
            "clareira escura."
        ),
        "saidas": {"sul": "entrada", "norte": "rio", "oeste": "clareira"},
        "itens": [],
    },
    "rio": {
        "nome": "Margem do Rio",
        "descricao": (
            "Um rio largo corta a floresta. Há uma ponte de madeira velha "
            "que atravessa para o outro lado, em direção a uma caverna "
            "sombria ao norte."
        ),
        "saidas": {"sul": "trilha", "norte": "caverna"},
        "itens": ["espada enferrujada"],
    },
    "clareira": {
        "nome": "Clareira Escura",
        "descricao": (
            "Uma clareira silenciosa. No centro, um lobo gigante observa "
            "você com olhos famintos. Você precisa de uma arma para "
            "passar."
        ),
        "saidas": {"leste": "trilha", "oeste": "altar"},
        "itens": [],
        "monstro": "lobo",
    },
    "altar": {
        "nome": "Altar Antigo",
        "descricao": (
            "Um altar de pedra coberto de musgo. Há runas brilhantes "
            "gravadas. Sobre ele repousa um amuleto dourado."
        ),
        "saidas": {"leste": "clareira"},
        "itens": ["amuleto dourado"],
    },
    "caverna": {
        "nome": "Entrada da Caverna",
        "descricao": (
            "A caverna está escura como breu. Sem luz, é impossível "
            "avançar. Há uma porta trancada ao norte."
        ),
        "saidas": {"sul": "rio", "norte": "tesouro"},
        "itens": [],
        "precisa_luz": True,
        "precisa_chave": True,
    },
    "tesouro": {
        "nome": "Câmara do Tesouro",
        "descricao": (
            "Uma câmara enorme repleta de ouro, jóias e relíquias antigas. "
            "No centro, sobre um pedestal, está a lendária Coroa do Rei "
            "Perdido."
        ),
        "saidas": {"sul": "caverna"},
        "itens": ["coroa do rei perdido"],
    },
}


def main():
    titulo("A LENDA DA CAVERNA PERDIDA")
    escreva(
        "Você é um aventureiro em busca da lendária Coroa do Rei Perdido, "
        "escondida em algum lugar desta floresta amaldiçoada. Boa sorte."
    )
    print()
    escreva("Comandos: norte, sul, leste, oeste, olhar, pegar <item>, "
            "inventario, usar <item>, atacar, ajuda, sair")
    print()

    sala_atual = "entrada"
    inventario = []
    monstros_mortos = set()

    descrever(SALAS[sala_atual], monstros_mortos)

    while True:
        try:
            comando = input("\n> ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            print()
            break

        if not comando:
            continue

        partes = comando.split(maxsplit=1)
        verbo = partes[0]
        argumento = partes[1] if len(partes) > 1 else ""

        if verbo in ("sair", "quit", "exit"):
            escreva("Até a próxima, aventureiro.")
            break

        elif verbo in ("ajuda", "help", "?"):
            escreva("Comandos: norte/sul/leste/oeste, olhar, pegar <item>, "
                    "inventario, usar <item>, atacar, sair")

        elif verbo in ("norte", "sul", "leste", "oeste", "n", "s", "l", "o"):
            direcao = {"n": "norte", "s": "sul", "l": "leste", "o": "oeste"}.get(verbo, verbo)
            sala = SALAS[sala_atual]

            if "monstro" in sala and sala["monstro"] not in monstros_mortos:
                escreva(f"O {sala['monstro']} bloqueia seu caminho! Você precisa atacá-lo.")
                continue

            if direcao not in sala["saidas"]:
                escreva("Você não pode ir nessa direção.")
                continue

            proxima = sala["saidas"][direcao]
            prox_sala = SALAS[proxima]

            if prox_sala.get("precisa_luz") and "tocha" not in inventario:
                escreva("Está escuro demais para entrar. Você precisa de uma fonte de luz.")
                continue

            if prox_sala.get("precisa_chave") and "chave enferrujada" not in inventario:
                escreva("A passagem está trancada. Você precisa de uma chave.")
                continue

            sala_atual = proxima
            descrever(SALAS[sala_atual], monstros_mortos)

            if sala_atual == "tesouro" and "coroa do rei perdido" not in inventario:
                pass

        elif verbo in ("olhar", "ver", "examinar"):
            descrever(SALAS[sala_atual], monstros_mortos)

        elif verbo == "pegar":
            sala = SALAS[sala_atual]
            if not argumento:
                escreva("Pegar o quê?")
                continue
            achado = None
            for item in sala["itens"]:
                if argumento in item or item in argumento:
                    achado = item
                    break
            if achado:
                sala["itens"].remove(achado)
                inventario.append(achado)
                escreva(f"Você pegou: {achado}.")
            else:
                escreva("Não há nada assim por aqui.")

        elif verbo in ("inventario", "inv", "i"):
            if inventario:
                escreva("Você carrega: " + ", ".join(inventario) + ".")
            else:
                escreva("Seu inventário está vazio.")

        elif verbo == "atacar":
            sala = SALAS[sala_atual]
            if "monstro" not in sala or sala["monstro"] in monstros_mortos:
                escreva("Não há nada para atacar aqui.")
                continue
            if "espada enferrujada" not in inventario:
                escreva(f"O {sala['monstro']} te despedaça com facilidade. "
                        "Você precisa de uma arma!")
                escreva("Fim de jogo.")
                return
            monstros_mortos.add(sala["monstro"])
            escreva(f"Após uma luta intensa, você derrota o {sala['monstro']}!")

        elif verbo == "usar":
            if not argumento:
                escreva("Usar o quê?")
                continue
            if argumento == "amuleto dourado" and "amuleto dourado" in inventario:
                escreva("O amuleto brilha e você sente sua força renovada.")
            else:
                escreva("Nada acontece.")

        else:
            escreva("Comando desconhecido. Digite 'ajuda' para ver os comandos.")

        if "coroa do rei perdido" in inventario:
            print()
            titulo("VITÓRIA!")
            escreva("Você obteve a Coroa do Rei Perdido e escapa da floresta "
                    "como uma lenda viva. Parabéns, aventureiro!")
            return


def descrever(sala, monstros_mortos):
    print()
    print(f"-- {sala['nome']} --")
    escreva(sala["descricao"])
    if "monstro" in sala and sala["monstro"] not in monstros_mortos:
        escreva(f"Um {sala['monstro']} feroz está aqui!")
    if sala["itens"]:
        escreva("Você vê: " + ", ".join(sala["itens"]) + ".")
    saidas = ", ".join(sala["saidas"].keys())
    escreva(f"Saídas: {saidas}.")


if __name__ == "__main__":
    main()
