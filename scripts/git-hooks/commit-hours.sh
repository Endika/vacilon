#!/bin/sh
# Blocks commits and pushes Monday-Friday before 19:00 local time.
# Only enforced where `git config vacilon.commitHours true` is set (see `make hooks`).
# VACILON_NOW_DOW (1=Mon..7=Sun) and VACILON_NOW_HOUR (00-23) override the clock for tests.

[ "$(git config --get vacilon.commitHours)" = "true" ] || exit 0

dow="${VACILON_NOW_DOW:-$(date +%u)}"
hour="${VACILON_NOW_HOUR:-$(date +%H)}"
hour="${hour#0}"
hour="${hour:-0}"

if [ "$dow" -le 5 ] && [ "$hour" -lt 19 ]; then
  echo "vacilon: commits y pushes solo de lunes a viernes a partir de las 19:00; el fin de semana, libre." >&2
  exit 1
fi
