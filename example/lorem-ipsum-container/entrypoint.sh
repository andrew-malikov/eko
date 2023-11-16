#!/usr/bin/env sh
lorem_id=$(
    tr -dc A-Za-z0-9 </dev/urandom | head -c 13
    echo
)
while true; do
    log_content=$(
        tr -dc A-Za-z0-9 </dev/urandom | head -c 32
        echo
    )
    echo "$lorem_id Lorem Ipsum $log_content"
    sleep 1
done
