#!/bin/bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📦 Installing all dependencies${NC}"
echo -e "==============================${NC}\n"

# Install root dependencies
echo -e "${YELLOW}📦 Installing root dependencies...${NC}"
if ! pnpm install --frozen-lockfile; then
  echo -e "${YELLOW}⚠️  Lockfile out of date. Retrying without --frozen-lockfile...${NC}"
  pnpm install --no-frozen-lockfile
fi

# Install packages dependencies
echo -e "\n${YELLOW}📦 Installing package dependencies...${NC}"
PACKAGES=$(find packages -name 'package.json' -not -path '*/node_modules/*' | sort)
for pkg in $PACKAGES; do
    DIR=$(dirname "$pkg")
    echo -e "Installing dependencies in $DIR..."
    if ! (cd "$DIR" && pnpm install --frozen-lockfile); then
      echo -e "${YELLOW}  ↳ Lockfile out of date in $DIR. Retrying without --frozen-lockfile...${NC}"
      (cd "$DIR" && pnpm install --no-frozen-lockfile)
    fi
done

# Install service dependencies
echo -e "\n${YELLOW}📦 Installing service dependencies...${NC}"
SERVICES=$(find services -name 'package.json' -not -path '*/node_modules/*' | sort)
for svc in $SERVICES; do
    DIR=$(dirname "$svc")
    echo -e "Installing dependencies in $DIR..."
    if ! (cd "$DIR" && pnpm install --frozen-lockfile); then
      echo -e "${YELLOW}  ↳ Lockfile out of date in $DIR. Retrying without --frozen-lockfile...${NC}"
      (cd "$DIR" && pnpm install --no-frozen-lockfile)
    fi
done

# Install app dependencies
echo -e "\n${YELLOW}📦 Installing app dependencies...${NC}"
APPS=$(find apps -name 'package.json' -not -path '*/node_modules/*' | sort)
for app in $APPS; do
    DIR=$(dirname "$app")
    echo -e "Installing dependencies in $DIR..."
    if ! (cd "$DIR" && pnpm install --frozen-lockfile); then
      echo -e "${YELLOW}  ↳ Lockfile out of date in $DIR. Retrying without --frozen-lockfile...${NC}"
      (cd "$DIR" && pnpm install --no-frozen-lockfile)
    fi
done

echo -e "\n${GREEN}✅ All dependencies installed!${NC}"
