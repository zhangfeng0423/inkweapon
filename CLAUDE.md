# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `pnpm dev` - Start development server with content collections
- `pnpm build` - Build the application and content collections
- `pnpm start` - Start production server
- `pnpm lint` - Run Biome linter (use for code quality checks)
- `pnpm lint:fix` - Run Biome linter with auto-fix (unsafe mode)
- `pnpm format` - Format code with Biome
- `pnpm knip` - Check for unused files and dependencies

### Database Operations (Drizzle ORM)
- `pnpm db:generate` - Generate new migration files based on schema changes
- `pnpm db:migrate` - Apply pending migrations to the database
- `pnpm db:push` - Sync schema changes directly to the database (development only)
- `pnpm db:studio` - Open Drizzle Studio for database inspection and management

### Content and Email
- `pnpm content` - Process MDX content collections
- `pnpm email` - Start email template development server on port 3333

### Deployment (OpenNext Cloudflare)
- `pnpm preview` - Preview Cloudflare deployment locally
- `pnpm deploy` - Deploy to Cloudflare using OpenNext
- `pnpm upload` - Upload assets to Cloudflare
- `pnpm cf-typegen` - Generate Cloudflare types

### Management Tools
- `pnpm list-users` - List all users in the database
- `pnpm list-contacts` - List all newsletter contacts

## Project Architecture

This is a Next.js 15 full-stack SaaS application with the following key architectural components:

### Core Stack
- **Framework**: Next.js 15 with App Router
- **Frontend**: React 19 (latest) with TypeScript strict mode
- **Styling**: TailwindCSS 4.0 with PostCSS
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth with social providers (Google, GitHub)
- **Payments**: Stripe integration with subscription and one-time payments
- **UI**: Radix UI components with Framer Motion animations
- **State Management**: Zustand for client-side state
- **Internationalization**: next-intl with English and Chinese locales
- **Content**: Fumadocs for documentation and MDX for content
- **Code Quality**: Biome for formatting and linting
- **Icons**: Lucide React for consistent iconography
- **Notifications**: Sonner for toast notifications
- **Deployment**: OpenNext for Cloudflare deployment

### Key Directory Structure
- `src/app/` - Next.js app router with internationalized routing
- `src/components/` - Reusable React components organized by feature
- `src/lib/` - Utility functions and shared code
- `src/db/` - Database schema and migrations
- `src/actions/` - Server actions for API operations
- `src/stores/` - Zustand state management
- `src/hooks/` - Custom React hooks
- `src/config/` - Application configuration files
- `src/i18n/` - Internationalization setup
- `src/mail/` - Email templates and mail functionality
- `src/payment/` - Stripe payment integration
- `src/credits/` - Credit system implementation
- `content/` - MDX content files for docs and blog
- `messages/` - Translation files (en.json, zh.json) for internationalization

### Authentication & User Management
- Uses Better Auth with PostgreSQL adapter
- Supports email/password and social login (Google, GitHub)
- Includes user management, email verification, and password reset
- Admin plugin for user management and banning
- Automatic newsletter subscription on user creation

### Payment System
- Stripe integration for subscriptions and one-time payments
- Three pricing tiers: Free, Pro (monthly/yearly), and Lifetime
- Credit system with packages for pay-per-use features
- Customer portal for subscription management

### Feature Modules
- **Blog**: MDX-based blog with pagination and categories
- **Docs**: Fumadocs-powered documentation
- **AI Features**: Comprehensive AI integration with multiple providers
  - **Image Generation**: OpenAI DALL-E, Replicate, FAL, Fireworks AI
  - **Text Generation**: OpenAI GPT, Anthropic Claude, Google Gemini
  - **Audio Processing**: OpenAI Whisper for transcription
  - **Video Processing**: Multi-provider video generation and processing
  - **Chat**: AI-powered chat interface with conversation history
- **Newsletter**: Email subscription system with automated onboarding
- **Analytics**: Multiple analytics providers support (Google Analytics, Plausible, etc.)
- **Storage**: S3 integration for file uploads with CDN optimization

### Development Workflow
1. Use TypeScript for all new code
2. Follow Biome formatting rules (single quotes, trailing commas)
3. Write server actions in `src/actions/`
4. Use Zustand for client-side state management
5. Implement database changes through Drizzle migrations
6. Use Radix UI components for consistent UI
7. Follow the established directory structure
8. Use proper error handling with error.tsx and not-found.tsx
9. Leverage Next.js 15 features like Server Actions
10. Use `next-safe-action` for secure form submissions

### Configuration
- Main config in `src/config/website.tsx`
- Environment variables template in `env.example`
- Database config in `drizzle.config.ts`
- Biome config in `biome.json` with specific ignore patterns
- TypeScript config with path aliases (@/* for src/*)

### Testing and Quality
- Use Biome for linting and formatting
- TypeScript for type safety
- Environment variables for configuration
- Proper error boundaries and not-found pages
- Zod for runtime validation

## Deployment Strategies

### Vercel Deployment (Recommended)
1. Connect repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch
4. Vercel handles build optimization and global CDN

### Cloudflare Deployment (OpenNext)
1. Use `pnpm deploy` to deploy with OpenNext
2. Configure Cloudflare Pages and Workers
3. Set environment variables in Cloudflare dashboard
4. Benefits: Better performance, lower cost at scale

### Environment Setup
1. Copy `env.example` to `.env.local`
2. Configure required environment variables:
   - Database URL (PostgreSQL)
   - Auth secrets (Better Auth)
   - Stripe keys (payment processing)
   - AI provider API keys
3. Run `pnpm db:migrate` to setup database schema

## Performance Optimization

### Image Optimization
- Images automatically optimized through Next.js Image component
- WebP format generation for modern browsers
- Lazy loading for below-the-fold images
- S3 integration with CDN for static assets

### Database Optimization
- Use Drizzle ORM query builder for efficient queries
- Implement proper database indexes for frequently queried columns
- Connection pooling through database provider
- Consider read replicas for high-traffic applications

### Bundle Optimization
- Code splitting at route level (automatic with App Router)
- Dynamic imports for heavy components
- Tree shaking of unused dependencies
- Minimize third-party dependencies

## Testing Strategy

### Current Status
⚠️ **No testing framework is currently configured** - This is a critical gap that should be addressed.

### Recommended Testing Setup
```bash
# Install testing dependencies
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
pnpm add -D @playwright/test # for E2E testing
```

### Testing Structure
- Unit tests: `__tests__/` directories alongside components
- Integration tests: `src/tests/integration/`
- E2E tests: `tests/e2e/`
- Database tests: `src/tests/db/`

### Recommended Test Files
- Component testing for UI components
- API route testing for server actions
- Database migration testing
- Payment flow testing (with Stripe test keys)

## Monitoring and Debugging

### Recommended Monitoring Setup
- **Error Tracking**: Sentry for production error monitoring
- **Performance**: Vercel Speed Insights or Cloudflare Analytics
- **User Behavior**: PostHog or Amplitude for product analytics
- **Uptime Monitoring**: Uptime Robot or similar service

### Debugging Tools
- Use Next.js built-in debugging with `next dev --debug`
- Database inspection through Drizzle Studio (`pnpm db:studio`)
- Network requests tab in browser dev tools
- Console logging for server actions (appears in terminal)

## Development Best Practices

### Server Actions
- Always validate input with Zod schemas
- Use proper error handling with try-catch blocks
- Implement rate limiting for expensive operations
- Return consistent response formats

### Credit System Implementation
- Use database transactions for credit operations
- Implement proper logging for credit transactions
- Handle race conditions with optimistic locking
- Provide clear error messages for insufficient credits

### AI Feature Development
- Implement proper error handling for API failures
- Use streaming responses for better UX
- Cache AI responses when appropriate
- Handle rate limits from AI providers

### Internationalization Workflow
1. Add new translatable text to `messages/en.json`
2. Add corresponding translation to `messages/zh.json`
3. Use `useTranslations()` hook in components
4. Test both language variants during development
5. Consider RTL language support for future expansion

## Important Notes

- The project uses pnpm as the package manager
- Database schema is in `src/db/schema.ts` with auth, payment, and credit tables
- Email templates are in `src/mail/templates/`
- The app supports both light and dark themes
- Content is managed through MDX files in the `content/` directory
- The project includes comprehensive internationalization support
- **No testing framework is currently configured** - this should be prioritized
- Use environment variables for all sensitive configuration
- Regular dependency updates recommended for security
