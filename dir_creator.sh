#!/bin/bash

# Create the root project directory and navigate into it
mkdir academic-planner
cd academic-planner

echo "🚀 Creating project structure for 'academic-planner'..."

# Create top-level files and directories
touch .gitignore README.md
mkdir client server

# --- Server Setup ---
echo "⚙️  Generating server structure..."
mkdir -p server/src/{api/{routes,controllers,middleware},config,services,models}
touch server/.env server/package.json server/package-lock.json
touch server/src/app.js server/src/server.js
touch server/src/api/routes/rules.routes.js
touch server/src/api/controllers/rules.controller.js
touch server/src/services/degreeAuditService.js

# --- Client Setup ---
echo "🎨 Generating client structure..."
mkdir -p client/public client/src/{api,assets,components,pages,store}
touch client/package.json client/package-lock.json
touch client/src/App.js client/src/index.js
touch client/src/api/api.js
touch client/src/components/Button.js client/src/components/CourseList.js
touch client/src/pages/RulesPage.js client/src/pages/PlannerPage.js

echo "✅ Done! Your monorepo structure is ready."