#!/bin/bash
# start-emulators.sh - Start Firebase emulators for development

echo "🔥 Starting Firebase emulators..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null
then
    echo "❌ Firebase CLI not found. Please install it:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "firebase.json" ]; then
    echo "❌ firebase.json not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Starting Firebase emulators..."
echo "📱 Auth: http://localhost:9099"
echo "🗄️ Firestore: http://localhost:8080"
echo "📁 Storage: http://localhost:9199"
echo "⚡ Functions: http://localhost:5001"
echo "🌐 UI: http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop the emulators"

# Start emulators
firebase emulators:start --only firestore,auth,storage,functions --project demo-communexus
