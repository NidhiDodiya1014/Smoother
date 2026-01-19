# Smoother - Music Streaming App

A modern music streaming application that allows you to extract and play audio from YouTube videos.

## Features

- 🎵 Extract audio from YouTube videos
- 🎶 Create and manage playlists
- 🔄 Queue system with loop functionality
- 📱 Responsive design for desktop and mobile
- 🎨 Dark theme with neon accents
- 🔊 Background playback support

## Prerequisites

- Node.js (v14 or higher)
- MongoDB database
- Cloudinary account (for audio storage)
- yt-dlp (automatically downloaded)

## Environment Variables

### Server (.env in server directory)

```env
PORT=8080
MONGO_URI=your_mongodb_connection_string
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET=your_cloudinary_api_secret
NODE_ENV=production
```

### Client (.env in client directory)

```env
VITE_API_URL=http://localhost:8080
PORT=3000
```

For production, set `VITE_API_URL` to your server URL.

## Installation

1. Clone the repository
2. Install server dependencies:
   ```bash
   cd server
   npm install
   ```

3. Install client dependencies:
   ```bash
   cd ../client
   npm install
   ```

## Development

### Start Server
```bash
cd server
npm start
```

### Start Client
```bash
cd client
npm run dev
```

## Production Deployment

### Option 1: Combined Deployment (Server serves client)

1. Build the client:
   ```bash
   cd client
   npm run build
   ```

2. Set `NODE_ENV=production` in server `.env`

3. Start the server:
   ```bash
   cd server
   npm start
   ```

The server will serve the built client files on the same port.

### Option 2: Separate Deployment

1. Build the client:
   ```bash
   cd client
   npm run build
   ```

2. Deploy the `client/dist` folder to a static hosting service (Vercel, Netlify, etc.)

3. Deploy the server separately (Heroku, Railway, etc.)

4. Set `VITE_API_URL` in client to your server URL before building

## Project Structure

```
Smoother/
├── client/          # React frontend
│   ├── src/
│   │   ├── pages/   # Page components
│   │   ├── components/ # Reusable components
│   │   └── config/  # Configuration files
│   └── dist/        # Build output (generated)
├── server/          # Express backend
│   ├── controllers/ # Route handlers
│   ├── models/      # Database models
│   ├── config/      # Configuration files
│   └── songs/       # Temporary audio storage
└── README.md
```

## Technologies Used

- **Frontend**: React, React Router, Vite, Bootstrap
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Audio Processing**: yt-dlp, ffmpeg
- **Storage**: Cloudinary

## License

ISC

