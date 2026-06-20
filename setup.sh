#!/bin/bash

# Script para criar a estrutura de pastas do SaaS IBGE

echo "Criando estrutura de pastas do SaaS IBGE..."

# Pastas principais
mkdir -p src/app/auth/login
mkdir -p src/app/auth/signup
mkdir -p src/app/dashboard/modules
mkdir -p src/app/dashboard/exams
mkdir -p src/app/api/auth
mkdir -p src/app/api/stripe
mkdir -p src/app/api/modules
mkdir -p src/app/api/lessons
mkdir -p src/app/api/questions
mkdir -p src/app/api/progress

# Components
mkdir -p src/components/ui
mkdir -p src/components/layout
mkdir -p src/components/dashboard
mkdir -p src/components/modules
mkdir -p src/components/lessons
mkdir -p src/components/quiz
mkdir -p src/components/common

# Lib
mkdir -p src/lib/supabase
mkdir -p src/lib/stripe
mkdir -p src/lib/auth
mkdir -p src/lib/hooks

# Public
mkdir -p public/images
mkdir -p public/icons

# Styles
mkdir -p src/styles

echo "✅ Estrutura de pastas criada com sucesso!"
echo ""
echo "Próximos passos:"
echo "1. npm install"
echo "2. Configurar .env.local com credenciais do Supabase e Stripe"
echo "3. Executar schema.sql no Supabase"
echo "4. npm run dev"
echo ""
echo "Para usar com Claude Code:"
echo "  claude"
echo ""
