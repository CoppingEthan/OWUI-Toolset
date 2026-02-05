FROM ubuntu:24.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=20

# System packages - comprehensive toolkit
RUN apt-get update && apt-get install -y \
    # Python
    python3 python3-pip python3-venv python3-dev \
    # Node.js (via nodesource for latest LTS)
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs \
    # Media processing
    ffmpeg \
    imagemagick \
    libmagickwand-dev \
    ghostscript \
    poppler-utils \
    # Document conversion
    pandoc \
    wkhtmltopdf \
    libreoffice-calc libreoffice-writer --no-install-recommends \
    # Data tools
    jq \
    csvkit \
    sqlite3 \
    # Network tools
    curl wget \
    httpie \
    # Version control
    git \
    # Compression
    zip unzip tar gzip bzip2 xz-utils p7zip-full \
    # Text processing
    ripgrep \
    # Build tools (for native npm/pip packages)
    build-essential \
    # Cleanup
    && rm -rf /var/lib/apt/lists/*

# Python packages - data science, web, documents, media
RUN pip3 install --break-system-packages --ignore-installed \
    # Data science core
    numpy \
    pandas \
    scipy \
    scikit-learn \
    # Visualisation / graphing
    matplotlib \
    seaborn \
    plotly \
    altair \
    bokeh \
    # Image processing
    pillow \
    opencv-python-headless \
    # Document handling
    openpyxl \
    xlrd \
    xlsxwriter \
    python-docx \
    PyPDF2 \
    pypdf \
    pdfplumber \
    python-pptx \
    # Web / API
    requests \
    httpx \
    beautifulsoup4 \
    lxml \
    selenium \
    # Data formats
    pyyaml \
    toml \
    xmltodict \
    # Text processing
    chardet \
    ftfy \
    fuzzywuzzy \
    python-Levenshtein \
    rapidfuzz \
    # Utilities
    tqdm \
    rich \
    tabulate \
    python-dateutil \
    pytz \
    # Audio/Video metadata
    mutagen \
    ffmpeg-python \
    # Compression
    py7zr \
    rarfile

# Global npm packages - useful CLI tools
RUN npm install -g \
    # Package managers
    yarn \
    pnpm \
    # Build tools
    typescript \
    esbuild \
    # Utilities
    prettier \
    # Markdown
    marked \
    # SVG
    svgo

# Create non-root user (remove existing UID 1000 user if present, e.g. ubuntu)
RUN existing=$(id -nu 1000 2>/dev/null) && [ -n "$existing" ] && userdel -r "$existing" || true \
    && useradd -m -u 1000 -s /bin/bash sandbox
RUN mkdir -p /workspace && chown sandbox:sandbox /workspace

# Allow sandbox user to install packages to user directory
RUN mkdir -p /home/sandbox/.local && chown -R sandbox:sandbox /home/sandbox
ENV PATH="/home/sandbox/.local/bin:${PATH}"
ENV PIP_USER=1

# Set working directory
WORKDIR /workspace
USER sandbox

# Default command (keep container running)
CMD ["sleep", "infinity"]
