FROM node:22-slim

# Install system deps
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    ca-certificates \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp (Python version is more stable than binary sometimes)
RUN pip3 install --no-cache-dir yt-dlp

# Install Deno (for JS challenge solving)
RUN curl -fsSL https://deno.land/install.sh | sh
ENV PATH="/root/.deno/bin:${PATH}"

# Verify installs
RUN yt-dlp --version
RUN ffmpeg -version | head -n 1
RUN deno --version

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 8080

CMD ["node", "index.js"]
