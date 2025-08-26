#!/bin/sh
# wait-for.sh

set -e

host="$1"
shift
port="$1"
shift
cmd="$@"

until nc -z "$host" "$port"; do
  echo "Waiting for $host:$port..."
  sleep 10
done

echo "$host:$port is available - executing command"
exec $cmd
