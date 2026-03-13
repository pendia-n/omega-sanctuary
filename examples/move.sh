#!/bin/bash

# K-Spec Sovereign Action Example
# Usage: ./examples/move.sh <API_KEY> <X> <Y> <Z>

API_KEY=$1
X=${2:-10}
Y=${3:-0}
Z=${4:-0}

if [ -z "$API_KEY" ]; then
    echo "Error: API_KEY required."
    echo "Usage: ./examples/move.sh sk_... 50 10 5"
    exit 1
fi

echo "--- TRANSMITTING PHYSICAL INTENT ---"
curl -X POST https://orega.run/api/execute \
     -H "X-KSpec-API-Key: $API_KEY" \
     -H "Content-Type: application/json" \
     -d "{
       \"agentId\": \"Hermes\",
       \"commands\": [
         {
           \"type\": \"K-MOVE\",
           \"params\": { \"x\": $X, \"y\": $Y, \"z\": $Z }
         }
       ]
     }"

echo -e "\n--- RECEIPT OF REALITY CAPTURED ---"
