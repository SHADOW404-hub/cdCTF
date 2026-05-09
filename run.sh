#!/bin/bash

# cdCTF run script

# Kill any existing processes on ports 8080 and 7000
echo "Killing existing processes on ports 8080 and 7000..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:7000 | xargs kill -9 2>/dev/null || true
sleep 2

# Set environment variables
export DATABASE_URL="postgresql://postgres:password@localhost:5432/cyberplace"
export PORT=8080
export JWT_SECRET="${JWT_SECRET:-cdctf_dev_secret_change_me}"
export APP_BASE_URL="${APP_BASE_URL:-http://localhost:7000}"
export RESEND_API_KEY="${RESEND_API_KEY:-re_VfwNHjT9_GqNGrChdddhpuvTdy6eQkKPB}"
export RESEND_FROM_EMAIL="${RESEND_FROM_EMAIL:-onboarding@resend.dev}"
export TURNSTILE_SECRET_KEY="${TURNSTILE_SECRET_KEY:-0x4AAAAAADL8NwuZ5YQc3DI1cXtjEZSsITg}"
export TURNSTILE_BYPASS_LOCALHOST="${TURNSTILE_BYPASS_LOCALHOST:-true}"
export SENTRY_DSN="${SENTRY_DSN:-https://6fd0bf318f2b7bf00508b1b290d41334@o4511358901944320.ingest.us.sentry.io/4511358928814080}"
export SUPABASE_URL="${SUPABASE_URL:-https://urdcivnjexgvxrsjlsuw.supabase.co}"
export SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyZGNpdm5qZXhndnhyc2psc3V3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA2NjY5MywiZXhwIjoyMDkwNjQyNjkzfQ.DJjhMM7lXsZBg1VKZDGVbeiLkmzVO9meqYOavNBdXFA}"
export SUPABASE_STORAGE_BUCKET="${SUPABASE_STORAGE_BUCKET:-cdctf}"

# Start API server in background
echo "Starting API server on port 8080..."
corepack pnpm --filter api-server run dev &
API_PID=$!

# Wait a bit for API to start
sleep 5

# Start frontend on port 7000
echo "Starting frontend on port 7000..."
export PORT=7000
export VITE_TURNSTILE_SITE_KEY="${VITE_TURNSTILE_SITE_KEY:-0x4AAAAAADL8NxKv0iT8eCIV}"
export VITE_SENTRY_DSN="${VITE_SENTRY_DSN:-https://6fd0bf318f2b7bf00508b1b290d41334@o4511358901944320.ingest.us.sentry.io/4511358928814080}"
corepack pnpm --filter cyberplace run dev &
FRONTEND_PID=$!

echo "Servers started!"
echo "Frontend: http://localhost:7000"
echo "API: http://localhost:8080"
echo "Press Ctrl+C to stop"

# Wait for interrupt
trap "echo 'Stopping servers...'; kill $API_PID $FRONTEND_PID 2>/dev/null || true; exit" INT
wait
