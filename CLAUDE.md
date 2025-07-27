# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VoiceForge is a text-to-speech web application built with Next.js 15 that uses Google Cloud Text-to-Speech API to convert Japanese and English text into high-quality audio. The application features segment-based audio generation, slide information management, and downloadable audio exports.

## Development Commands

### Core Development
```bash
cd voiceforge
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint checks
```

### Docker Environment
```bash
# Development mode (with hot reloading)
./launch.sh

# Production mode
./launch.sh prod

# Stop development
./stop.sh

# Stop production
./stop.sh prod
```

## Architecture

### Project Structure
The codebase consists of two main parts:
- **Root directory**: Contains scripts and documentation
- **voiceforge directory**: The main Next.js application

### Key Components Architecture

**Text Processing Flow:**
```
Input Text → Period-based Segmentation → Parallel TTS API Calls → Audio URL Generation → Component State Management
```

**Component Hierarchy:**
- `src/app/page.tsx` - Main page with state management
- `src/components/ui/audio-player/` - Audio playback controls
- `src/components/ui/` - UI components (TextInput, VoiceSettings, etc.)
- `src/app/api/tts/route.ts` - TTS API endpoint
- `src/utils/` - Utility functions and validators

### State Management
The application uses React state management with the following key patterns:
- **TextSegment interface**: Manages text, audio URL, loading states, and slide information
- **Semi-automatic slide numbering**: When slide number is set, subsequent segments inherit the same number
- **Memory management**: Audio URLs are properly cleaned up with `URL.revokeObjectURL()`

### API Architecture
- **POST /api/tts**: Accepts text and voice settings, returns Base64-encoded MP3 audio
- **Google TTS Integration**: Configured via `GOOGLE_CLOUD_API_KEY` environment variable
- **Client-side processing**: Base64 to Blob conversion and URL generation

## Environment Configuration

### Required Environment Variables
```bash
# In voiceforge/.env.local
GOOGLE_CLOUD_API_KEY=your-api-key-here
```

### Voice Settings
- **Languages**: Japanese (ja-JP), English (en-US)
- **Voice types**: WaveNet and Standard voices
- **Parameters**: Speaking rate (0.25-4.0), Pitch (-20 to +20)

## Development Patterns

### Text Segmentation
Text is automatically split by periods (`。`) into manageable segments for individual audio generation. Each segment maintains:
- Original and edited text versions
- Loading states during generation
- Audio duration metadata
- Optional slide number and order

### Error Handling
- Input validation using `src/utils/validators.ts`
- API error responses with descriptive messages
- Per-segment error handling during batch generation

### TypeScript Usage
- Strict TypeScript configuration
- Centralized type definitions in `src/types/index.ts`
- Interface-driven component props

## Testing and Quality

### Code Quality Tools
- ESLint with Next.js configuration
- TypeScript strict mode enabled
- No formal test framework currently configured

### Performance Considerations
- Parallel audio generation for multiple segments
- Client-side Base64 to Blob conversion
- Proper cleanup of object URLs to prevent memory leaks

## Docker Configuration

The application includes separate Docker configurations:
- `docker/docker-compose.dev.yml` - Development with hot reloading
- `docker/docker-compose.prod.yml` - Production optimized build
- Environment variable `WATCHPACK_POLLING=true` for development file watching