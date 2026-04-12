#!/bin/bash

# Script de verificación de DNS para yebaam.com
# Este script verifica el estado de la configuración DNS

echo " Verificación de DNS para yebaam.com"
echo "========================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar Nameservers en WHOIS
echo "1️⃣  Verificando Nameservers en WHOIS..."
echo "----------------------------------------"
NAMESERVERS=$(whois yebaam.com | grep -i "Name Server:" | head -4)
echo "$NAMESERVERS"
echo ""

# Nameservers esperados
EXPECTED_NS=(
    "ns-380.awsdns-47.com"
    "ns-1796.awsdns-32.co.uk"
    "ns-1496.awsdns-59.org"
    "ns-981.awsdns-58.net"
)

# Verificar si los nameservers están configurados correctamente
CORRECT_NS=0
for ns in "${EXPECTED_NS[@]}"; do
    if echo "$NAMESERVERS" | grep -qi "$ns"; then
        ((CORRECT_NS++))
    fi
done

if [ $CORRECT_NS -eq 4 ]; then
    echo -e "${GREEN} Nameservers configurados correctamente!${NC}"
else
    echo -e "${YELLOW}  Solo $CORRECT_NS/4 nameservers están configurados${NC}"
    echo -e "${YELLOW}   Por favor actualiza los nameservers en GoDaddy${NC}"
fi
echo ""

# 2. Verificar resolución DNS del dominio raíz
echo "2️⃣  Verificando resolución DNS de yebaam.com..."
echo "----------------------------------------"
DNS_RESULT=$(nslookup yebaam.com 8.8.8.8 2>&1)

if echo "$DNS_RESULT" | grep -qi "SERVFAIL\|can't find"; then
    echo -e "${RED} DNS aún no resuelve${NC}"
    echo "   Esperando propagación DNS..."
else
    echo -e "${GREEN} DNS resuelve correctamente${NC}"
    echo "$DNS_RESULT" | grep "Address:" | tail -4
fi
echo ""

# 3. Verificar www subdomain
echo "3️⃣  Verificando www.yebaam.com..."
echo "----------------------------------------"
WWW_RESULT=$(nslookup www.yebaam.com 8.8.8.8 2>&1)

if echo "$WWW_RESULT" | grep -qi "SERVFAIL\|can't find"; then
    echo -e "${RED} www subdomain no resuelve${NC}"
else
    echo -e "${GREEN} www subdomain resuelve correctamente${NC}"
    echo "$WWW_RESULT" | grep "canonical\|Address" | tail -2
fi
echo ""

# 4. Verificar Amplify domain status
echo "4️⃣  Verificando estado del dominio en AWS Amplify..."
echo "----------------------------------------"
if command -v aws &> /dev/null; then
    export AWS_PROFILE=yeebaam-client
    DOMAIN_STATUS=$(aws amplify get-domain-association --app-id dwqmm5iclbz1m --domain-name yebaam.com --query 'domainAssociation.domainStatus' --output text 2>/dev/null)
    
    if [ ! -z "$DOMAIN_STATUS" ]; then
        case $DOMAIN_STATUS in
            "AVAILABLE")
                echo -e "${GREEN} Dominio DISPONIBLE y funcionando!${NC}"
                ;;
            "PENDING_VERIFICATION")
                echo -e "${YELLOW} Esperando verificación del certificado SSL${NC}"
                ;;
            "PENDING_DEPLOYMENT")
                echo -e "${YELLOW} Esperando deployment${NC}"
                ;;
            "CREATING")
                echo -e "${YELLOW} Creando configuración del dominio${NC}"
                ;;
            *)
                echo -e "${YELLOW} Estado: $DOMAIN_STATUS${NC}"
                ;;
        esac
    else
        echo -e "${YELLOW}  No se pudo verificar el estado (verifica AWS_PROFILE)${NC}"
    fi
else
    echo -e "${YELLOW}  AWS CLI no instalado - no se puede verificar estado de Amplify${NC}"
fi
echo ""

# 5. Test de accesibilidad HTTP
echo "5️⃣  Probando acceso HTTP/HTTPS..."
echo "----------------------------------------"

# Probar yebaam.com
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://yebaam.com --connect-timeout 10 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN} https://yebaam.com responde correctamente (200 OK)${NC}"
elif [ "$HTTP_CODE" = "000" ]; then
    echo -e "${RED} https://yebaam.com no accesible (DNS no propagado)${NC}"
else
    echo -e "${YELLOW}  https://yebaam.com responde con código: $HTTP_CODE${NC}"
fi

# Probar www.yebaam.com
HTTP_CODE_WWW=$(curl -s -o /dev/null -w "%{http_code}" https://www.yebaam.com --connect-timeout 10 2>/dev/null)
if [ "$HTTP_CODE_WWW" = "200" ]; then
    echo -e "${GREEN} https://www.yebaam.com responde correctamente (200 OK)${NC}"
elif [ "$HTTP_CODE_WWW" = "000" ]; then
    echo -e "${RED} https://www.yebaam.com no accesible (DNS no propagado)${NC}"
else
    echo -e "${YELLOW}  https://www.yebaam.com responde con código: $HTTP_CODE_WWW${NC}"
fi
echo ""

# Resumen final
echo " RESUMEN"
echo "========================================"
if [ $CORRECT_NS -eq 4 ] && [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}🎉 ¡Todo está funcionando perfectamente!${NC}"
    echo ""
    echo "URLs disponibles:"
    echo "  • https://yebaam.com (Producción)"
    echo "  • https://www.yebaam.com (Producción)"
    echo "  • https://develop.dwqmm5iclbz1m.amplifyapp.com (Desarrollo)"
elif [ $CORRECT_NS -eq 4 ]; then
    echo -e "${YELLOW} Nameservers configurados, esperando propagación DNS${NC}"
    echo "   Esto puede tomar de 1 a 48 horas (normalmente 2-6 horas)"
    echo "   Ejecuta este script de nuevo en 1 hora"
else
    echo -e "${YELLOW}  Acción requerida:${NC}"
    echo "   1. Ve a GoDaddy: https://dcc.godaddy.com/manage/yebaam.com/dns"
    echo "   2. Cambia los nameservers a:"
    echo "      • ns-380.awsdns-47.com"
    echo "      • ns-1796.awsdns-32.co.uk"
    echo "      • ns-1496.awsdns-59.org"
    echo "      • ns-981.awsdns-58.net"
    echo "   3. Ejecuta este script de nuevo en 1-2 horas"
fi
echo ""
