#!/bin/bash
set -euo pipefail

# Function to create a service
create_service() {
  local SERVICE_NAME=$1
  local PORT=$2
  local DB_NAME=$3
  local DESCRIPTION=$4
  
  echo "Creating $SERVICE_NAME service..."
  
  mkdir -p services/$SERVICE_NAME/src/{controllers,entities,services}
  
  # Create package.json
  cat > services/$SERVICE_NAME/package.json << EOF
{
  "name": "@medi-aide/$SERVICE_NAME",
  "version": "1.0.0",
  "private": true,
  "main": "dist/main.js",
  "scripts": {
    "dev": "tsx watch src/main.ts",
    "build": "tsc",
    "start": "node dist/main.js"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/config": "^3.2.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "pg": "^8.12.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "typeorm": "^0.3.20"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0"
  }
}
EOF

  # Create tsconfig.json
  cat > services/$SERVICE_NAME/tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

  # Create Dockerfile
  cat > services/$SERVICE_NAME/Dockerfile << EOF
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
EXPOSE $PORT
CMD ["npm", "start"]
EOF

  echo "✅ $SERVICE_NAME service created"
}

# Create remaining services
create_service "ai-service" 4018 "ai_db" "AI and ML predictions"
create_service "care-plan-service" 4019 "care_plan_db" "Care plan management"
create_service "evv-service" 4020 "evv_db" "Electronic visit verification"
create_service "file-service" 4021 "file_db" "Document management"
create_service "search-service" 4022 "search_db" "Search functionality"
create_service "matching-service" 4023 "matching_db" "Caregiver-patient matching"
create_service "training-service" 4024 "training_db" "Education and training"
create_service "feedback-service" 4025 "feedback_db" "Reviews and ratings"
create_service "communication-service" 4026 "communication_db" "Messaging and chat"

echo "✅ All services created successfully!"
