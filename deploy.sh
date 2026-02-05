#!/bin/bash
# OWUI Toolset V2 - Full Deployment Script
# Handles fresh install (clone + provision) and updates (pull + smart rebuild)
# Preserves all user data (data/, .env, databases) across updates
# Supports: Ubuntu/Debian, CentOS/RHEL/Fedora, Arch Linux

set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════
# Constants
# ═══════════════════════════════════════════════════════════════════════════

REPO_URL="https://github.com/CoppingEthan/OWUI-Toolset.git"
DEFAULT_INSTALL_DIR="/opt/owui-toolset"
INSTALL_DIR="${OWUI_INSTALL_DIR:-$DEFAULT_INSTALL_DIR}"

# Set SCRIPT_DIR only if not piped (BASH_SOURCE is empty when piped via curl)
if [ -n "${BASH_SOURCE[0]:-}" ] && [ "${BASH_SOURCE[0]}" != "bash" ]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
else
    SCRIPT_DIR=""
fi

# State variables
IS_EXISTING_INSTALL=false
REPO_DIR=""
DOCKERFILE_HASH_BEFORE=""
DOCKERFILE_HASH_AFTER=""

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
echo "  OWUI Toolset V2 - Deployment Script"
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

# ═══════════════════════════════════════════════════════════════════════════
# Helper: hash a file for change detection
# ═══════════════════════════════════════════════════════════════════════════

hash_file() {
    if command -v sha256sum &>/dev/null; then
        sha256sum "$1" | cut -d' ' -f1
    elif command -v md5sum &>/dev/null; then
        md5sum "$1" | cut -d' ' -f1
    else
        # Cannot hash; return unique value to force rebuild
        echo "no-hash-$(date +%s)"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# Step 1: Install Git
# ═══════════════════════════════════════════════════════════════════════════

install_git() {
    echo ""
    log_info "Step 1/8: Checking Git..."

    if command -v git &> /dev/null; then
        log_success "Git already installed ($(git --version | cut -d' ' -f3))"
        return 0
    fi

    log_info "Installing Git..."
    $SUDO $PKG_UPDATE
    $SUDO $PKG_INSTALL git

    log_success "Git installed"
}

# ═══════════════════════════════════════════════════════════════════════════
# Step 2: Clone or update repository
# ═══════════════════════════════════════════════════════════════════════════

# Determine if we're inside an existing install or need a fresh clone
detect_context() {
    # Case 1: Running from inside the repo (user ran ./deploy.sh from repo dir)
    if [ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/package.json" ] && \
       grep -q '"owui-toolset-v2"' "$SCRIPT_DIR/package.json" 2>/dev/null; then
        REPO_DIR="$SCRIPT_DIR"
        IS_EXISTING_INSTALL=true
        log_info "Running from existing installation: $REPO_DIR"
        return 0
    fi

    # Case 2: The default install directory already has our repo
    if [ -d "$INSTALL_DIR" ] && [ -f "$INSTALL_DIR/package.json" ] && \
       grep -q '"owui-toolset-v2"' "$INSTALL_DIR/package.json" 2>/dev/null; then
        REPO_DIR="$INSTALL_DIR"
        IS_EXISTING_INSTALL=true
        log_info "Found existing installation at: $REPO_DIR"
        return 0
    fi

    # Case 3: Fresh install needed
    REPO_DIR="$INSTALL_DIR"
    IS_EXISTING_INSTALL=false
    log_info "No existing installation found. Will install to: $REPO_DIR"
}

clone_fresh_repo() {
    log_info "Cloning OWUI-Toolset to $REPO_DIR..."

    # Ensure parent directory exists
    local parent_dir
    parent_dir="$(dirname "$REPO_DIR")"
    if [ ! -d "$parent_dir" ]; then
        $SUDO mkdir -p "$parent_dir"
    fi

    # Clone - use sudo if we can't write to parent dir
    if [ -w "$parent_dir" ]; then
        git clone "$REPO_URL" "$REPO_DIR"
    else
        $SUDO git clone "$REPO_URL" "$REPO_DIR"
        # Fix ownership so npm/node don't need sudo later
        $SUDO chown -R "$(id -u):$(id -g)" "$REPO_DIR"
    fi

    log_success "Repository cloned to $REPO_DIR"
}

update_existing_repo() {
    log_info "Updating existing installation at $REPO_DIR..."

    # Capture Dockerfile hash BEFORE pull for smart rebuild comparison
    if [ -f "$REPO_DIR/docker/sandbox/Dockerfile" ]; then
        DOCKERFILE_HASH_BEFORE=$(hash_file "$REPO_DIR/docker/sandbox/Dockerfile")
    fi

    cd "$REPO_DIR"

    # Stash any unexpected tracked-file changes (safety net)
    if ! git diff --quiet 2>/dev/null; then
        log_warn "Uncommitted changes in tracked files detected. Stashing..."
        git stash
    fi

    # Pull latest - try fast-forward first (safest)
    if git pull --ff-only origin main 2>/dev/null; then
        log_success "Repository updated (fast-forward)"
    else
        log_warn "Fast-forward failed, attempting merge pull..."
        if git pull origin main; then
            log_success "Repository updated (merge)"
        else
            log_error "Git pull failed. You may have local conflicts."
            log_error "Resolve manually in $REPO_DIR, then re-run this script."
            exit 1
        fi
    fi

    # Capture Dockerfile hash AFTER pull
    if [ -f "$REPO_DIR/docker/sandbox/Dockerfile" ]; then
        DOCKERFILE_HASH_AFTER=$(hash_file "$REPO_DIR/docker/sandbox/Dockerfile")
    fi
}

acquire_repo() {
    echo ""
    log_info "Step 2/8: Acquiring repository..."

    if [ "$IS_EXISTING_INSTALL" = true ]; then
        update_existing_repo
    else
        clone_fresh_repo
    fi
}

# Re-execute from the cloned repo if we were run standalone (e.g. curl | bash)
maybe_reexec() {
    # Guard against infinite re-execution loops
    if [ "${OWUI_REEXEC:-0}" = "1" ]; then
        # We are already a re-exec'd instance; continue normally
        SCRIPT_DIR="$REPO_DIR"
        return 0
    fi

    # If we cloned fresh and are NOT already running from inside the repo,
    # re-execute the deploy.sh from within the cloned repo
    if [ "$IS_EXISTING_INSTALL" = false ] && [ "$SCRIPT_DIR" != "$REPO_DIR" ]; then
        log_info "Re-executing deploy script from cloned repository..."
        exec env OWUI_REEXEC=1 bash "$REPO_DIR/deploy.sh"
        # exec replaces this process; nothing below runs
    fi

    # We are running from inside the repo; update SCRIPT_DIR
    SCRIPT_DIR="$REPO_DIR"
}

# ═══════════════════════════════════════════════════════════════════════════
# Service management: stop running instance before updating
# ═══════════════════════════════════════════════════════════════════════════

stop_running_instance() {
    if [ "$IS_EXISTING_INSTALL" = false ]; then
        return 0  # Fresh install, nothing to stop
    fi

    log_info "Checking for running OWUI Toolset instance..."

    # Method 1: Check for PID file
    local pidfile="$REPO_DIR/.owui.pid"
    if [ -f "$pidfile" ]; then
        local pid
        pid=$(cat "$pidfile")
        if kill -0 "$pid" 2>/dev/null; then
            log_info "Stopping OWUI Toolset (PID $pid)..."
            kill "$pid"
            # Wait up to 10 seconds for graceful shutdown
            local waited=0
            while kill -0 "$pid" 2>/dev/null && [ "$waited" -lt 10 ]; do
                sleep 1
                waited=$((waited + 1))
            done
            if kill -0 "$pid" 2>/dev/null; then
                log_warn "Process did not stop gracefully, forcing..."
                kill -9 "$pid" 2>/dev/null || true
            fi
            log_success "OWUI Toolset stopped"
            rm -f "$pidfile"
            return 0
        else
            log_info "PID file exists but process is not running"
            rm -f "$pidfile"
        fi
    fi

    # Method 2: Find node process running src/index.js from this directory
    local pids
    pids=$(pgrep -f "node.*${REPO_DIR}/src/index.js" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        log_info "Found running OWUI Toolset process(es): $pids"
        echo "$pids" | xargs kill 2>/dev/null || true
        sleep 2
        # Force kill any survivors
        echo "$pids" | xargs kill -9 2>/dev/null || true
        log_success "OWUI Toolset stopped"
    else
        log_info "No running instance detected"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# Step 3: Install Docker
# ═══════════════════════════════════════════════════════════════════════════

install_docker() {
    echo ""
    log_info "Step 3/8: Checking Docker..."

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
# Step 4: Install Node.js
# ═══════════════════════════════════════════════════════════════════════════

install_nodejs() {
    echo ""
    log_info "Step 4/8: Checking Node.js..."

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
# Step 5: Install iptables and persistence tools
# ═══════════════════════════════════════════════════════════════════════════

install_iptables() {
    echo ""
    log_info "Step 5/8: Checking iptables..."

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
# Step 6: Install npm dependencies
# ═══════════════════════════════════════════════════════════════════════════

install_npm_deps() {
    echo ""
    log_info "Step 6/8: Installing npm dependencies..."

    cd "$SCRIPT_DIR"

    if [ ! -f "package.json" ]; then
        log_error "package.json not found in $SCRIPT_DIR"
        exit 1
    fi

    npm install

    log_success "npm dependencies installed"
}

# ═══════════════════════════════════════════════════════════════════════════
# Step 7: Build Docker sandbox image (smart rebuild)
# ═══════════════════════════════════════════════════════════════════════════

build_sandbox_image() {
    echo ""
    log_info "Step 7/8: Docker sandbox image..."

    if [ ! -f "$SCRIPT_DIR/docker/sandbox/Dockerfile" ]; then
        log_error "Dockerfile not found at $SCRIPT_DIR/docker/sandbox/Dockerfile"
        exit 1
    fi

    local needs_rebuild=false

    # Fresh install - always build
    if [ "$IS_EXISTING_INSTALL" = false ]; then
        needs_rebuild=true
        log_info "Fresh install: building sandbox image..."
    # Image doesn't exist at all
    elif ! $SUDO docker image inspect owui-sandbox-base:latest &>/dev/null; then
        needs_rebuild=true
        log_info "Sandbox image not found: building..."
    # Dockerfile changed during git pull
    elif [ -n "$DOCKERFILE_HASH_BEFORE" ] && [ -n "$DOCKERFILE_HASH_AFTER" ] && \
         [ "$DOCKERFILE_HASH_BEFORE" != "$DOCKERFILE_HASH_AFTER" ]; then
        needs_rebuild=true
        log_info "Dockerfile changed: rebuilding sandbox image..."
    else
        log_success "Sandbox image is up to date (Dockerfile unchanged)"
        return 0
    fi

    if [ "$needs_rebuild" = true ]; then
        $SUDO docker build -t owui-sandbox-base:latest "$SCRIPT_DIR/docker/sandbox/"
        log_success "Sandbox image built: owui-sandbox-base:latest"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# Step 8: Configure network isolation
# ═══════════════════════════════════════════════════════════════════════════

configure_network() {
    echo ""
    log_info "Step 8/8: Configuring network isolation..."

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

# Phase 1: Bootstrap
detect_os
get_pkg_manager
check_privileges

install_git
detect_context
acquire_repo
maybe_reexec

# Phase 2: Service management
stop_running_instance

# Phase 3: System dependencies
install_docker
install_nodejs
install_iptables

# Phase 4: Application setup
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
if [ "$IS_EXISTING_INSTALL" = true ]; then
    echo "  Mode:      UPDATE (existing installation preserved)"
else
    echo "  Mode:      FRESH INSTALL"
fi
echo "  Location:  $REPO_DIR"
echo "  Docker:    $(docker --version 2>/dev/null | cut -d' ' -f3 | tr -d ',' || echo 'installed')"
echo "  Node.js:   $(node --version 2>/dev/null || echo 'installed')"
echo "  npm:       $(npm --version 2>/dev/null || echo 'installed')"
echo "  Image:     owui-sandbox-base:latest"
echo "  Network:   sandbox_network (172.30.0.0/16)"
echo ""
echo "Network Isolation:"
echo "  [OK] Internet access: ALLOWED"
echo "  [XX] LAN access:      BLOCKED (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)"
echo "  [XX] Localhost:        BLOCKED (127.0.0.0/8)"
echo ""
echo "Data preserved across updates:"
echo "  data/       (database, metrics)"
echo "  .env        (configuration, API keys)"
echo ""

if [ ! -f "$REPO_DIR/.env" ]; then
    echo -e "${YELLOW}NOTE: No .env file found.${NC}"
    echo "  Create one before starting:"
    echo "  nano $REPO_DIR/.env"
    echo ""
fi

echo "To start OWUI Toolset:"
echo "  cd $REPO_DIR"
echo "  npm start"
echo ""
echo "To update later, just re-run this script:"
echo "  cd $REPO_DIR && ./deploy.sh"
echo ""
echo "Or from anywhere:"
echo "  curl -fsSL https://raw.githubusercontent.com/CoppingEthan/OWUI-Toolset/main/deploy.sh | sudo bash"
echo ""
