# Social Media Agent Frontend

A beautiful, modern frontend for the AI-powered Social Media Agent built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🎨 **Beautiful UI**: Modern, responsive design with smooth animations
- 🔐 **Social Authentication**: Sign up with LinkedIn or Twitter (dummy implementation)
- 🤖 **AI Agent Interface**: Real-time chat with the AI agent
- 📱 **Multi-platform Support**: Create content for LinkedIn and Twitter
- 🖼️ **Image Integration**: Generate and review images for posts
- ⚡ **Real-time Streaming**: Server-Sent Events for live updates
- 🎯 **Human Feedback**: Interactive feedback system for content refinement

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks
- **API**: Custom API client with fetch

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- The backend server running on `http://localhost:8000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
client/
├── app/
│   ├── components/          # Reusable UI components
│   │   ├── Button.tsx
│   │   └── Card.tsx
│   ├── lib/                 # Utility functions
│   │   └── api.ts          # API client
│   ├── agent/              # Agent interaction page
│   │   └── page.tsx
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Authentication page
├── public/                 # Static assets
└── package.json
```

## API Integration

The frontend communicates with the backend through these endpoints:

- `POST /api/create-post` - Create a new post session
- `GET /api/stream/{session_id}` - Stream execution results
- `POST /api/human-feedback` - Send human feedback
- `GET /api/session/{session_id}` - Get session status
- `DELETE /api/session/{session_id}` - Delete session

## Key Features

### Authentication Page (`/`)
- Social login with LinkedIn and Twitter
- Feature showcase
- Beautiful gradient background
- Loading states and animations

### Agent Page (`/agent`)
- Real-time chat interface
- Platform selection (LinkedIn/Twitter)
- Image toggle
- Post preview panel
- Human feedback handling
- Quick action buttons

## Development

### Adding New Components

1. Create components in `app/components/`
2. Use TypeScript interfaces for props
3. Follow the existing styling patterns with Tailwind CSS

### API Integration

1. Add new methods to `app/lib/api.ts`
2. Use the `ApiClient` class for all server communication
3. Handle errors gracefully with try-catch blocks

### Styling

- Use Tailwind CSS utility classes
- Follow the design system in `globals.css`
- Use the custom color palette defined in `tailwind.config.js`

## Environment Variables

Create a `.env.local` file for environment-specific configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Building for Production

```bash
npm run build
npm start
```

## Contributing

1. Follow the existing code style
2. Use TypeScript for all new code
3. Add proper error handling
4. Test the UI on different screen sizes
5. Ensure accessibility standards are met
