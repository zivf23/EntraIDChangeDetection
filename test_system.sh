#!/bin/bash

# EntraID Change Detection System - Test Script
# =============================================
# This script performs comprehensive system checks

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    EntraID System Comprehensive Test       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo

# Get auth credentials from .env
if [ -f .env ]; then
    source .env
else
    echo -e "${RED}✗ .env file not found${NC}"
    exit 1
fi

# Track overall status
ALL_GOOD=true

# 1. Check Docker containers
echo -e "${YELLOW}1. Checking Docker containers...${NC}"
BACKEND_STATUS=$(docker-compose ps backend 2>/dev/null | grep -c "Up")
FRONTEND_STATUS=$(docker-compose ps frontend 2>/dev/null | grep -c "Up")

if [ "$BACKEND_STATUS" -eq 1 ]; then
    echo -e "${GREEN}  ✓ Backend container is running${NC}"
else
    echo -e "${RED}  ✗ Backend container is not running${NC}"
    ALL_GOOD=false
fi

if [ "$FRONTEND_STATUS" -eq 1 ]; then
    echo -e "${GREEN}  ✓ Frontend container is running${NC}"
else
    echo -e "${RED}  ✗ Frontend container is not running${NC}"
    ALL_GOOD=false
fi

# 2. Check API health
echo -e "\n${YELLOW}2. Checking API health...${NC}"
if curl -s -f http://localhost:5000/api/health > /dev/null 2>&1; then
    HEALTH=$(curl -s http://localhost:5000/api/health)
    echo -e "${GREEN}  ✓ API health check passed${NC}"
    echo -e "    Response: ${HEALTH}"
else
    echo -e "${RED}  ✗ API health check failed${NC}"
    ALL_GOOD=false
fi

# 3. Check API authentication
echo -e "\n${YELLOW}3. Testing API authentication...${NC}"
AUTH=$(echo -n "${ADMIN_USER}:${ADMIN_PASS}" | base64)
RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:5000/api/snapshots \
    -H "Authorization: Basic $AUTH" \
    -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}  ✓ API authentication successful${NC}"
    SNAPSHOT_COUNT=$(echo "$BODY" | grep -o "id" | wc -l)
    echo -e "    Found ${SNAPSHOT_COUNT} snapshots"
else
    echo -e "${RED}  ✗ API authentication failed (HTTP ${HTTP_CODE})${NC}"
    echo -e "    Check ADMIN_USER and ADMIN_PASS in .env"
    ALL_GOOD=false
fi

# 4. Check Frontend
echo -e "\n${YELLOW}4. Checking frontend accessibility...${NC}"
if curl -s -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Frontend is accessible at http://localhost:3000${NC}"
else
    echo -e "${RED}  ✗ Frontend is not accessible${NC}"
    ALL_GOOD=false
fi

# 5. Check secrets configuration
echo -e "\n${YELLOW}5. Checking secrets configuration...${NC}"
SECRETS_OK=true
for secret in graph_tenant_id graph_client_id graph_client_secret openai_api_key; do
    if [ -f "secrets/${secret}.txt" ]; then
        content=$(cat "secrets/${secret}.txt" 2>/dev/null)
        if [[ "$content" == *"your-"* ]] || [ -z "$content" ]; then
            echo -e "${RED}  ✗ ${secret}.txt contains placeholder or is empty${NC}"
            SECRETS_OK=false
            ALL_GOOD=false
        else
            echo -e "${GREEN}  ✓ ${secret}.txt is configured${NC}"
        fi
    else
        echo -e "${RED}  ✗ ${secret}.txt is missing${NC}"
        SECRETS_OK=false
        ALL_GOOD=false
    fi
done

# 6. Test Microsoft Graph connection
echo -e "\n${YELLOW}6. Testing Microsoft Graph API connection...${NC}"
if [ "$BACKEND_STATUS" -eq 1 ] && [ "$SECRETS_OK" = true ]; then
    GRAPH_TEST=$(docker-compose exec -T backend python -c "
try:
    from graph_client import get_current_config
    config = get_current_config()
    print('SUCCESS')
except Exception as e:
    print(f'ERROR: {e}')
" 2>&1)
    
    if [[ "$GRAPH_TEST" == *"SUCCESS"* ]]; then
        echo -e "${GREEN}  ✓ Microsoft Graph API connection successful${NC}"
    else
        echo -e "${RED}  ✗ Microsoft Graph API connection failed${NC}"
        echo -e "    ${GRAPH_TEST}"
        ALL_GOOD=false
    fi
else
    echo -e "${YELLOW}  ⚠️  Skipping Graph API test (prerequisites not met)${NC}"
fi

# 7. Test OpenAI connection
echo -e "\n${YELLOW}7. Testing OpenAI API connection...${NC}"
if [ "$BACKEND_STATUS" -eq 1 ] && [ "$SECRETS_OK" = true ]; then
    OPENAI_TEST=$(docker-compose exec -T backend python -c "
try:
    from openai_client import get_explanation
    result = get_explanation(['Test change'])
    if result:
        print('SUCCESS')
    else:
        print('ERROR: Empty response')
except Exception as e:
    print(f'ERROR: {e}')
" 2>&1)
    
    if [[ "$OPENAI_TEST" == *"SUCCESS"* ]]; then
        echo -e "${GREEN}  ✓ OpenAI API connection successful${NC}"
    else
        echo -e "${RED}  ✗ OpenAI API connection failed${NC}"
        echo -e "    ${OPENAI_TEST}"
        ALL_GOOD=false
    fi
else
    echo -e "${YELLOW}  ⚠️  Skipping OpenAI test (prerequisites not met)${NC}"
fi

# 8. Check database
echo -e "\n${YELLOW}8. Checking database...${NC}"
if docker-compose exec -T backend ls monitor_data.db >/dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Database file exists${NC}"
    
    # Get row count
    ROW_COUNT=$(docker-compose exec -T backend python -c "
import sqlite3
conn = sqlite3.connect('monitor_data.db')
count = conn.execute('SELECT COUNT(*) FROM snapshots').fetchone()[0]
print(count)
conn.close()
" 2>&1)
    
    if [[ "$ROW_COUNT" =~ ^[0-9]+$ ]]; then
        echo -e "    Database contains ${ROW_COUNT} snapshots"
    fi
else
    echo -e "${YELLOW}  ⚠️  Database will be created on first run${NC}"
fi

# 9. Check scheduled jobs
echo -e "\n${YELLOW}9. Checking scheduled jobs...${NC}"
SCHEDULER_LOG=$(docker-compose logs backend 2>&1 | grep -c "Scheduler started" || true)
if [ "$SCHEDULER_LOG" -gt 0 ]; then
    echo -e "${GREEN}  ✓ Scheduler is configured${NC}"
    echo -e "    Check interval: ${CHECK_INTERVAL_MINUTES} minutes"
else
    echo -e "${YELLOW}  ⚠️  Could not verify scheduler status${NC}"
fi

# Summary
echo
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Test Summary                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo

if [ "$ALL_GOOD" = true ]; then
    echo -e "${GREEN}✅ All tests passed! System is working correctly.${NC}"
    echo
    echo -e "${GREEN}You can now:${NC}"
    echo "  1. Open http://localhost:3000"
    echo "  2. Login with username: ${ADMIN_USER}"
    echo "  3. The first snapshot will be taken within ${CHECK_INTERVAL_MINUTES} minutes"
else
    echo -e "${RED}❌ Some tests failed. Please fix the issues above.${NC}"
    echo
    echo -e "${YELLOW}Common fixes:${NC}"
    echo "  - Start containers: docker-compose up -d"
    echo "  - Check logs: docker-compose logs -f"
    echo "  - Rebuild: docker-compose down && docker-compose build"
    echo "  - Configure secrets in secrets/*.txt files"
fi

# Offer to show logs if there are failures
if [ "$ALL_GOOD" = false ]; then
    echo
    echo -e "${YELLOW}Would you like to see the logs? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "\n${YELLOW}Recent backend logs:${NC}"
        docker-compose logs --tail=20 backend
    fi
fi