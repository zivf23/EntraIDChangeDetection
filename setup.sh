#!/bin/bash

# EntraID Change Detection System - Setup Script
# ==============================================
# This script helps set up the system for first-time users

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   EntraID Change Detection System Setup    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo "  Please install Docker from https://www.docker.com/"
    exit 1
else
    echo -e "${GREEN}✓ Docker found${NC}"
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    echo "  Please install Docker Compose"
    exit 1
else
    echo -e "${GREEN}✓ Docker Compose found${NC}"
fi

# Create directories
echo -e "\n${YELLOW}Creating directories...${NC}"
mkdir -p secrets data logs
echo -e "${GREEN}✓ Directories created${NC}"

# Check for secrets
echo -e "\n${YELLOW}Checking secrets configuration...${NC}"
MISSING_SECRETS=()
PLACEHOLDER_SECRETS=()

for secret in graph_tenant_id graph_client_id graph_client_secret openai_api_key; do
    if [ -f "secrets/${secret}.txt" ]; then
        content=$(cat "secrets/${secret}.txt" 2>/dev/null || echo "")
        if [[ "$content" == *"your-"* ]] || [[ "$content" == "" ]]; then
            PLACEHOLDER_SECRETS+=("$secret")
        fi
    else
        MISSING_SECRETS+=("$secret")
    fi
done

# Create missing secret files with placeholders
if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
    echo -e "${YELLOW}Creating placeholder secret files...${NC}"
    for secret in "${MISSING_SECRETS[@]}"; do
        echo "your-${secret}-here" > "secrets/${secret}.txt"
        echo -e "  Created: secrets/${secret}.txt"
    done
fi

# Set permissions on secrets
chmod 600 secrets/*.txt 2>/dev/null || true

# Report secret status
if [ ${#MISSING_SECRETS[@]} -gt 0 ] || [ ${#PLACEHOLDER_SECRETS[@]} -gt 0 ]; then
    echo -e "\n${RED}⚠️  Action Required: Configure your secrets${NC}"
    echo -e "${YELLOW}Please edit these files with your actual values:${NC}"
    
    echo -e "\n${BLUE}Microsoft Entra ID credentials:${NC}"
    echo "  1. secrets/graph_tenant_id.txt    - Your Azure tenant ID"
    echo "  2. secrets/graph_client_id.txt    - Your app registration client ID"
    echo "  3. secrets/graph_client_secret.txt - Your app registration secret"
    
    echo -e "\n${BLUE}OpenAI credentials:${NC}"
    echo "  4. secrets/openai_api_key.txt     - Your OpenAI API key"
    
    echo -e "\n${YELLOW}To get Microsoft Entra ID credentials:${NC}"
    echo "  1. Go to https://portal.azure.com"
    echo "  2. Navigate to Microsoft Entra ID > App registrations"
    echo "  3. Create new app or use existing"
    echo "  4. Copy the values from Overview and Certificates & secrets"
    
    echo -e "\n${YELLOW}To get OpenAI API key:${NC}"
    echo "  1. Go to https://platform.openai.com/api-keys"
    echo "  2. Create new secret key"
else
    echo -e "${GREEN}✓ All secrets configured${NC}"
fi

# Check .env file
echo -e "\n${YELLOW}Checking environment configuration...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    if [ -f ".env.template" ]; then
        cp .env.template .env
    else
        # Create default .env if template doesn't exist
        cat > .env << 'EOF'
# Docker Configuration
SECRETS_DIR=./secrets

# API Authentication
ADMIN_USER=admin
ADMIN_PASS=changeMe123!

# React App Configuration
REACT_APP_ADMIN_USER=admin
REACT_APP_ADMIN_PASS=changeMe123!

# Application Settings
CHECK_INTERVAL_MINUTES=10
OPENAI_MODEL=gpt-3.5-turbo
LOG_LEVEL=INFO
EOF
    fi
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}  ⚠️  Please edit .env and change ADMIN_PASS from default${NC}"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Build containers
echo -e "\n${YELLOW}Building Docker containers...${NC}"
docker-compose build
echo -e "${GREEN}✓ Containers built successfully${NC}"

# Summary
echo
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Setup Complete!               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo

# Next steps
if [ ${#MISSING_SECRETS[@]} -gt 0 ] || [ ${#PLACEHOLDER_SECRETS[@]} -gt 0 ]; then
    echo -e "${RED}Before starting the system:${NC}"
    echo "1. Add your actual credentials to the secrets/*.txt files"
    echo "2. Change ADMIN_PASS in .env file"
    echo
fi

echo -e "${GREEN}To start the system:${NC}"
echo "  docker-compose up -d"
echo
echo -e "${GREEN}To view logs:${NC}"
echo "  docker-compose logs -f"
echo
echo -e "${GREEN}To access the application:${NC}"
echo "  http://localhost:3000"
echo "  Username: admin"
echo "  Password: (from .env file)"
echo

# Offer to start the system
if [ ${#MISSING_SECRETS[@]} -eq 0 ] && [ ${#PLACEHOLDER_SECRETS[@]} -eq 0 ]; then
    echo -e "${YELLOW}Would you like to start the system now? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${YELLOW}Starting system...${NC}"
        docker-compose up -d
        
        echo -e "\n${GREEN}System started!${NC}"
        echo "Waiting for services to initialize..."
        sleep 5
        
        # Quick health check
        if curl -s -f http://localhost:5000/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Backend is healthy${NC}"
        else
            echo -e "${YELLOW}⚠️  Backend is still starting up...${NC}"
        fi
        
        echo -e "\n${GREEN}Access the application at: http://localhost:3000${NC}"
    fi
fi