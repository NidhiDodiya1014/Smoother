FROM node:22-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    ffprobe \
    curl \
    python3 \
    python3-pip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir yt-dlp

RUN yt-dlp --version && ffmpeg -version | head -n 1

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["node", "index.js"]
