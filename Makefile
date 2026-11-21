PY := $(HOME)/.local/venvs/vacilon/bin
export CUDA_VISIBLE_DEVICES :=
EPOCHS ?= 16
OUT ?= models/candidato.pt

.DEFAULT_GOAL := help
.PHONY: help chat dev app app-pc test py-test web-test lint check hooks corpus finetune certify informe promote rollback

help: ## Muestra esta ayuda
	@echo "Comandos de Chispa (ver GUIA.md):"
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-10s %s\n", $$1, $$2}'

chat: ## Habla con Chispa en el terminal
	$(PY)/vacilon

dev: ## App en modo desarrollo con recarga automática (http://localhost:5173)
	cd web && npm run dev -- --port 5173 --strictPort

app: ## Sirve la versión montada en https://192.168.100.100:4443 (desde otros dispositivos haría falta abrir el puerto)
	cd web && npm run preview:lan

app-pc: ## Sirve la versión montada solo en este PC (http://localhost:4173)
	cd web && npm run build && npx vite preview --port 4173

test: py-test web-test ## Pasa todos los tests (Python y app)

py-test:
	$(PY)/pytest -q

web-test:
	cd web && npm test

lint: ## Pasa ruff y mypy sobre el código de Python
	$(PY)/ruff check src scripts tests
	$(PY)/ruff format --check src scripts tests
	$(PY)/mypy

check: lint py-test ## Todas las puertas de calidad: Python y app
	cd web && npm run format:check && npm run lint && npm run type:check && npm run test:run

corpus: ## Valida el corpus y lo prepara para entrenar y para la memoria
	$(PY)/python scripts/validate_corpus.py
	PYTHONPATH=src $(PY)/python scripts/prepare_finetune.py
	PYTHONPATH=src $(PY)/python scripts/prepare_memory.py

finetune: ## Reentrena a Chispa con el corpus actual (EPOCHS=16 OUT=models/candidato.pt)
	unset CUDA_VISIBLE_DEVICES; PYTHONPATH=src $(PY)/python scripts/finetune.py --epochs $(EPOCHS) --out $(OUT) --subs-mix 0

certify: ## Examina un modelo nuevo (CANDIDATE=models/candidato.pt [VERSION=v2])
	@test -n "$(CANDIDATE)" || (echo "uso: make certify CANDIDATE=models/candidato.pt [VERSION=v2]" && exit 2)
	$(PY)/python scripts/certify.py --candidate $(CANDIDATE) $(if $(VERSION),--version $(VERSION)) $(if $(SAMPLES),--samples $(SAMPLES))

informe: ## Abre en el navegador el informe de una versión (VERSION=v2)
	@test -n "$(VERSION)" || (echo "uso: make informe VERSION=v2" && exit 2)
	explorer.exe "$$(wslpath -w models/registry/$(VERSION)/report.html)" || true

promote: ## Instala en la app una versión aprobada (VERSION=v2 [FORCE=1])
	@test -n "$(VERSION)" || (echo "uso: make promote VERSION=v2 [FORCE=1]" && exit 2)
	$(PY)/python scripts/promote.py $(VERSION) $(if $(FORCE),--force)

rollback: ## Vuelve a la versión anterior de Chispa
	$(PY)/python scripts/rollback.py

hooks: ## Activa los hooks de git y el horario de commits (hace falta un repo git)
	@test -d .git || (echo "make hooks: no hay repo git aquí (haz git init primero)" >&2 && exit 1)
	git config --local vacilon.commitHours true
	npm --prefix web run prepare
