#!/bin/bash
# OWUI Toolset V2 - Full Deployment Script
# Installs all dependencies, builds sandbox image, configures network isolation
# Supports: Ubuntu/Debian, CentOS/RHEL/Fedora, Arch Linux

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo "=================================================="
echo "  OWUI Toolset V2 - Full Deployment Script"
echo "=================================================="
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# Detect OS and package manager
# ═══════════════════════════════════════════════════════════════════════════

detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
    elif [ -f /etc/redhat-release ]; then
        OS="rhel"
    else
        OS="unknown"
    fi

    log_info "Detected OS: $OS ${OS_VERSION:-}"
}

# Determine package manager
get_pkg_manager() {
    if command -v apt-get &> /dev/null; then
        PKG_MANAGER="apt"
        PKG_UPDATE="apt-get update"
        PKG_INSTALL="apt-get install -y"
    elif command -v dnf &> /dev/null; then
        PKG_MANAGER="dnf"
        PKG_UPDATE="dnf check-update || true"
        PKG_INSTALL="dnf install -y"
    elif command -v yum &> /dev/null; then
        PKG_MANAGER="yum"
        PKG_UPDATE="yum check-update || true"
        PKG_INSTALL="yum install -y"
    elif command -v pacman &> /dev/null; then
        PKG_MANAGER="pacman"
        PKG_UPDATE="pacman -Sy"
        PKG_INSTALL="pacman -S --noconfirm"
    else
        log_error "No supported package manager found (apt, dnf, yum, pacman)"
        exit 1
    fi

    log_info "Package manager: $PKG_MANAGER"
}

# Check if running as root or with sudo
check_privileges() {
    if [ "$EUID" -eq 0 ]; then
        SUDO=""
        log_info "Running as root"
    elif command -v sudo &> /dev/null; then
        SUDO="sudo"
        log_info "Running with sudo"
        # Test sudo access
        if ! sudo -n true 2>/dev/null; then
            log_warn "sudo requires password - you may be prompted"
        fi
    else
        log_error "This script requires root privileges or sudo"
        exit 1
    fi
}

detect_os
get_pkg_manager
check_privileges

# ═══════════════════════════════════════════════════════════════════════════
# Step 1: Install Docker
# ═══════════════════════════════════════════════════════════════════════════

install_docker() {
    echo ""
    log_info "Step 1/6: Checking Docker..."

    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
        log_success "Docker already installed (v$DOCKER_VERSION)"
        return 0
    fi

    log_info "Installing Docker..."

    case $PKG_MANAGER in
        apt)
            # Ubuntu/Debian - use official Docker repo
            $SUDO apt-get update
            $SUDO apt-get install -y ca-certificates curl gnupg

            # Add Docker's official GPG key
            $SUDO install -m 0755 -d /etc/apt/keyrings
            if [ ! -f /etc/apt/keyrings/docker.gpg ]; then
                curl -fsSL https://download.docker.com/linux/$OS/gpg | $SUDO gpg --dearmor -o /etc/apt/keyrings/docker.gpg
                $SUDO chmod a+r /etc/apt/keyrings/docker.gpg
            fi

            # Add Docker repo
            echo \
                "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS \
                $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
                $SUDO tee /etc/apt/sources.list.d/docker.list > /dev/null

            $SUDO apt-get update
            $SUDO apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            ;;

        dnf|yum)
            # CentOS/RHEL/Fedora
            $SUDO $PKG_INSTALL yum-utils || true
            $SUDO yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo 2>/dev/null || \
            $SUDO yum-config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo 2>/dev/null || true
            $SUDO $PKG_INSTALL docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            ;;

        pacman)
            # Arch Linux
            $SUDO pacman -S --noconfirm docker docker-compose
            ;;
    esac

    # Start and enable Docker
    $SUDO systemctl start docker
    $SUDO systemctl enable docker

    # Add current user to docker group (if not root)
    if [ "$EUID" -ne 0 ]; then
        $SUDO usermod -aG docker "$USER" || true
        log_warn "Added $USER to docker group - you may need to log out and back in"
    fi

    log_success "Docker installed successfully"
}

# ═══════════════════════════════════════════════════════════════════════════
# Step 2: Install Node.js
# ═══════════════════════════════════════════════════════════════════════════

install_nodejs() {
    echo ""
    log_info "Step 2/6: Checking Node.js..."

    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'.' -f1 | tr -d 'v')

        if [ "$NODE_MAJOR" -ge 18 ]; then
            log_success "Node.js already installed ($NODE_VERSION)"
            return 0
        else
            log_warn "Node.js $NODE_VERSION is too old (need v18+), upgrading..."
        fi
    fi

    log_info "Installing Node.js 20 LTS..."

    case $PKG_MANAGER in
        apt)
            # Use NodeSource for latest LTS
            curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO bash -
            $SUDO apt-get install -y nodejs
            ;;

        dnf|yum)
            curl -fsSL https://rpm.nodesource.com/setup_20.x | $SUDO bash -
            $SUDO $PKG_INSTALL nodejs
            ;;

        pacman)
            $SUDO pacman -S --noconfirm nodejs npm
            ;;
    esac

    log_success "Node.js $(node --version) installed"
}

# ═══════════════════════════════════════════════════════════════════════════
# Step 3: Install iptables and persistence tools
# ═══════════════════════════════════════════════════════════════════════════

install_iptables() {
    echo ""
    log_info "Step 3/6: Checking iptables..."

    if ! command -v iptables &> /dev/null; then
        log_info "Installing iptables..."
        case $PKG_MANAGER in
            apt)
                $SUDO apt-get install -y iptables
                ;;
            dnf|yum)
                $SUDO $PKG_INSTALL iptables iptables-services
                ;;
            pacman)
                $SUDO pacman -S --noconfirm iptables
                ;;
        esac
    fi

    log_success "iptables available"

    # Install persistence tool
    log_info "Setting up iptables persistence..."

    case $PKG_MANAGER in
        apt)
            # Pre-answer debconf questions to avoid interactive prompt
            echo iptables-persistent iptables-persistent/autosave_v4 boolean true | $SUDO debconf-set-selections 2>/dev/null || true
            echo iptables-persistent iptables-persistent/autosave_v6 boolean true | $SUDO debconf-set-selections 2>/dev/null || true
            $SUDO apt-get install -y iptables-persistent netfilter-persistent || true
            ;;
        dnf|yum)
            $SUDO systemctl enable iptables 2>/dev/null || true
            ;;
        pacman)
            $SUDO systemctl enable iptables 2>/dev/null || true
            ;;
    esac

    log_success "iptables persistence configured"
}

# ═══════════════════════════════════════════════════════════════════════════
# Step 4: Install npm dependencies
# ═══════════════════════════════════════════════════════════════════════════

install_npm_deps() {
    echo ""
    log_info "Step 4/6: Installing npm dependencies..."

    cd "$SCRIPT_DIR"

    if [ ! -f "package.json" ]; then
        log_error "package.json not found in $SCRIPT_DIR"
        exit 1
    fi

    npm install

    log_success "npm dependencies installed"
}

# ═══════════════════════════════════════════════════════════════════════════
# Step 5: Build Docker sandbox image
# ═══════════════════════════════════════════════════════════════════════════

build_sandbox_image() {
    echo ""
    log_info "Step 5/6: Building sandbox Docker image..."

    if [ ! -f "$SCRIPT_DIR/docker/sandbox/Dockerfile" ]; then
        log_error "Dockerfile not found at $SCRIPT_DIR/docker/sandbox/Dockerfile"
        exit 1
    fi

    # Build the image (may take a while first time)
    $SUDO docker build -t owui-sandbox-base:latest "$SCRIPT_DIR/docker/sandbox/"

    log_success "Sandbox image built: owui-sandbox-base:latest"
}

# ═══════════════════════════════════════════════════════════════════════════
# Step 6: Configure network isolation
# ═══════════════════════════════════════════════════════════════════════════

configure_network() {
    echo ""
    log_info "Step 6/6: Configuring network isolation..."

    # Create sandbox network if it doesn't exist
    if $SUDO docker network inspect sandbox_network >/dev/null 2>&1; then
        log_success "Network already exists: sandbox_network"
    else
        $SUDO docker network create \
            --driver bridge \
            --subnet 172.30.0.0/16 \
            --opt com.docker.network.bridge.name=sandbox_br \
            sandbox_network
        log_success "Network created: sandbox_network (172.30.0.0/16)"
    fi

    # Apply iptables rules
    log_info "Applying iptables rules for LAN isolation..."

    # Remove existing sandbox rules (clean slate)
    $SUDO iptables -D DOCKER-USER -s 172.30.0.0/16 -j ACCEPT 2>/dev/null || true
    $SUDO iptables -D DOCKER-USER -s 172.30.0.0/16 -d 127.0.0.0/8 -j DROP 2>/dev/null || true
    $SUDO iptables -D DOCKER-USER -s 172.30.0.0/16 -d 169.254.0.0/16 -j DROP 2>/dev/null || true
    $SUDO iptables -D DOCKER-USER -s 172.30.0.0/16 -d 192.168.0.0/16 -j DROP 2>/dev/null || true
    $SUDO iptables -D DOCKER-USER -s 172.30.0.0/16 -d 172.16.0.0/12 -j DROP 2>/dev/null || true
    $SUDO iptables -D DOCKER-USER -s 172.30.0.0/16 -d 10.0.0.0/8 -j DROP 2>/dev/null || true
    $SUDO iptables -D DOCKER-USER -m state --state ESTABLISHED,RELATED -j ACCEPT 2>/dev/null || true

    # Apply rules (order matters - inserted in reverse because -I inserts at top)
    $SUDO iptables -I DOCKER-USER -m state --state ESTABLISHED,RELATED -j ACCEPT
    $SUDO iptables -I DOCKER-USER -s 172.30.0.0/16 -d 10.0.0.0/8 -j DROP
    $SUDO iptables -I DOCKER-USER -s 172.30.0.0/16 -d 172.16.0.0/12 -j DROP
    $SUDO iptables -I DOCKER-USER -s 172.30.0.0/16 -d 192.168.0.0/16 -j DROP
    $SUDO iptables -I DOCKER-USER -s 172.30.0.0/16 -d 169.254.0.0/16 -j DROP
    $SUDO iptables -I DOCKER-USER -s 172.30.0.0/16 -d 127.0.0.0/8 -j DROP
    $SUDO iptables -A DOCKER-USER -s 172.30.0.0/16 -j ACCEPT

    log_success "iptables rules applied"

    # Persist rules
    log_info "Persisting iptables rules..."
    if command -v netfilter-persistent &> /dev/null; then
        $SUDO netfilter-persistent save 2>/dev/null || true
        log_success "Rules saved via netfilter-persistent"
    elif [ -d /etc/iptables ]; then
        $SUDO iptables-save > /etc/iptables/rules.v4 2>/dev/null || \
        $SUDO sh -c 'iptables-save > /etc/iptables/rules.v4' || true
        log_success "Rules saved to /etc/iptables/rules.v4"
    elif [ -d /etc/sysconfig ]; then
        $SUDO sh -c 'iptables-save > /etc/sysconfig/iptables' || true
        log_success "Rules saved to /etc/sysconfig/iptables"
    else
        log_warn "Could not persist iptables rules - run this script again after reboot"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# Run all steps
# ═══════════════════════════════════════════════════════════════════════════

install_docker
install_nodejs
install_iptables
install_npm_deps
build_sandbox_image
configure_network

# ═══════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo "=================================================="
echo -e "${GREEN}  Deployment Complete!${NC}"
echo "=================================================="
echo ""
echo "Summary:"
echo "  Docker:    $(docker --version 2>/dev/null | cut -d' ' -f3 | tr -d ',' || echo 'installed')"
echo "  Node.js:   $(node --version 2>/dev/null || echo 'installed')"
echo "  npm:       $(npm --version 2>/dev/null || echo 'installed')"
echo "  Image:     owui-sandbox-base:latest"
echo "  Network:   sandbox_network (172.30.0.0/16)"
echo ""
echo "Network Isolation:"
echo "  ✓ Internet access: ALLOWED"
echo "  ✗ LAN access:      BLOCKED (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)"
echo "  ✗ Localhost:       BLOCKED (127.0.0.0/8)"
echo ""
echo "To start OWUI Toolset:"
echo "  cd $SCRIPT_DIR"
echo "  npm start"
echo ""
echo "To verify network isolation:"
echo "  # Should work (internet):"
echo "  docker run --rm --network sandbox_network owui-sandbox-base:latest curl -s https://google.com | head -c 100"
echo ""
echo "  # Should fail (LAN blocked):"
echo "  docker run --rm --network sandbox_network owui-sandbox-base:latest curl -s --connect-timeout 5 http://192.168.1.1"
echo ""
