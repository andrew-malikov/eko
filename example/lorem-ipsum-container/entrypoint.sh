#!/usr/bin/env sh
lorem_id=$(
    tr -dc A-Za-z0-9 </dev/urandom | head -c 13
    echo
)
while true; do
    echo "Lorem Ipsum $lorem_id"
    sleep 3
done
