#!/bin/sh

TIMEOUT=60
QUIET=0

host="$1"
port="$2"
shift 2
cmd="$@"

until nc -z "$host" "$port" >/dev/null 2>&1; do
  echo "Waiting for $host:$port..."
  sleep 1
  TIMEOUT=$((TIMEOUT - 1))
  if [ $TIMEOUT -eq 0 ]; then
    echo "Timeout reached waiting for $host:$port"
    exit 1
  fi
done

echo "$host:$port is available"
[ -n "$cmd" ] && exec $cmd || exit 0
