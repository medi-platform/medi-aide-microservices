#!/bin/bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Installing Helmfile and Dependencies${NC}"
echo -e "======================================${NC}"

# Detect OS
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# Convert architecture naming
case ${ARCH} in
    x86_64)
        ARCH="amd64"
        ;;
    aarch64|arm64)
        ARCH="arm64"
        ;;
esac

# Install Helm if not present
if ! command -v helm &> /dev/null; then
    echo -e "\n${YELLOW}📦 Installing Helm...${NC}"
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
else
    echo -e "${GREEN}✅ Helm already installed: $(helm version --short)${NC}"
fi

# Install Helmfile
HELMFILE_VERSION="0.159.0"
echo -e "\n${YELLOW}📦 Installing Helmfile v${HELMFILE_VERSION}...${NC}"

if [[ "$OS" == "darwin" ]]; then
    # macOS
    if command -v brew &> /dev/null; then
        brew install helmfile
    else
        # Manual installation for macOS
        curl -fsSL -o helmfile_${HELMFILE_VERSION}_${OS}_${ARCH}.tar.gz \
            https://github.com/helmfile/helmfile/releases/download/v${HELMFILE_VERSION}/helmfile_${HELMFILE_VERSION}_${OS}_${ARCH}.tar.gz
        tar -xzf helmfile_${HELMFILE_VERSION}_${OS}_${ARCH}.tar.gz
        sudo mv helmfile /usr/local/bin/
        rm helmfile_${HELMFILE_VERSION}_${OS}_${ARCH}.tar.gz
    fi
else
    # Linux
    wget -q https://github.com/helmfile/helmfile/releases/download/v${HELMFILE_VERSION}/helmfile_${HELMFILE_VERSION}_${OS}_${ARCH}.tar.gz
    tar -xzf helmfile_${HELMFILE_VERSION}_${OS}_${ARCH}.tar.gz
    sudo mv helmfile /usr/local/bin/
    rm helmfile_${HELMFILE_VERSION}_${OS}_${ARCH}.tar.gz
fi

# Verify installation
if command -v helmfile &> /dev/null; then
    echo -e "${GREEN}✅ Helmfile installed: $(helmfile version)${NC}"
else
    echo -e "${RED}❌ Helmfile installation failed${NC}"
    exit 1
fi

# Install Helm plugins required by Helmfile
echo -e "\n${YELLOW}🔌 Installing Helm plugins...${NC}"

# helm-diff plugin for showing diffs
helm plugin install https://github.com/databus23/helm-diff || true

# helm-secrets plugin for secret management
helm plugin install https://github.com/jkroepke/helm-secrets || true

# helm-git plugin for git repo support
helm plugin install https://github.com/aslafy-z/helm-git || true

echo -e "\n${GREEN}✅ Installation complete!${NC}"
echo -e "\n${YELLOW}📋 Installed plugins:${NC}"
helm plugin list

echo -e "\n${YELLOW}💡 Next steps:${NC}"
echo -e "1. Add Helm repositories:"
echo -e "   cd kubernetes/infrastructure && helmfile repos"
echo -e "2. Check diff before applying:"
echo -e "   helmfile -e development diff"
echo -e "3. Deploy infrastructure:"
echo -e "   helmfile -e development sync"
