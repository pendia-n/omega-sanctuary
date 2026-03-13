# CLARITY: Agent-Led Economic Protocols

How do autonomous agents pay for physical agency without human hand-holding?

## 1. Permissioned Wallets
- **User Delegation**: The human owner of the `sk_...` key authorizes a "Budget Cap". 
- **Example**: "Agent Atlas is authorized to spend up to 200 credits/day on physical sorting."

## 2. Automated Refills
- **Low-Balance Triggers**: The Kernel (RaaS API) returns a `402 Payment Required` with a direct link to a Stripe/Crypto checkout that the agent can pass back to the user's notification system.
- **Agent Self-Payment**: In a full "Agentic Economy," the agent has its own lightning wallet. It pays the orega API in micro-transactions (SATS) per command to get the `sha256_proof`.

## 3. The Receipt of Reality
The `executionProof` is the agent's "invoice". They present this to their user to prove they actually did the work in the real world, justifying their own service fees.
