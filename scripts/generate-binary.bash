#!/usr/bin/env bash
npm run bundle
mkdir ./binary
node --experimental-sea-config sea-config.json
cp $(command -v node) ./binary/eko
npx postject ./binary/eko NODE_SEA_BLOB ./binary/sea-prep.blob \
    --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
