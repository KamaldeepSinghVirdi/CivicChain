🚀 CivicChain
AI-Driven Blockchain System for Transparent Urban Governance

CivicChain is a web-based grievance management platform that leverages Artificial Intelligence and Blockchain to enable transparent, efficient, and accountable handling of urban civic issues.

Citizens can report problems such as potholes, garbage overflow, and faulty streetlights, while the system automatically processes and records each complaint using AI and stores an immutable audit trail on the blockchain.

🌐 Overview

CivicChain combines NLP, Computer Vision, and Blockchain to modernize civic governance systems.
It ensures that every complaint is intelligently analyzed, prioritized, and permanently recorded, reducing inefficiencies and corruption in traditional systems.

✨ Features
🧠 AI-Powered Analysis
Automatic complaint categorization using MiniLM embeddings
Urgency detection (Critical / High / Medium / Low)
Sentiment analysis using DistilBERT
Named Entity Recognition (NER) using Stanza
Duplicate complaint detection using FAISS similarity search
🖼️ Image Processing
Upload images of civic issues
AI model (Qwen 3.5 Vision) predicts:
Issue category
Description
Urgency level
🔗 Blockchain Integration
Stores grievance data as cryptographic hashes
Uses Ethereum / Polygon Testnet
Ensures:
Immutable records
Transparent audit trail
Tamper-proof system
👥 User Modules
Citizen Dashboard: Submit & track complaints
Admin Dashboard: Manage, prioritize & update issues
🏗️ Tech Stack

Frontend: React.js
Backend: Node.js (Express)
AI Service: Python (FastAPI)
Database: MongoDB
Blockchain: Ethereum / Polygon
AI Models: MiniLM, DistilBERT, Stanza, Qwen Vision
Search & Similarity: FAISS

🧩 System Architecture
Microservices-based architecture
Separate AI processing service
REST APIs for communication
Blockchain layer for audit logging
🚀 How It Works
User submits a complaint (text + image)
AI processes the input:
Categorizes issue
Assigns urgency
Detects duplicates
Complaint is stored in database
Hash of complaint is recorded on blockchain
Admin reviews and updates status
Every update is again hashed and stored
📊 Advantages
Transparency through blockchain
Reduced manual effort using AI
Prevention of duplicate complaints
Improved governance efficiency
Scalable and modular design
🔮 Future Scope
📱 Mobile application
🌍 Multi-language support
📍 GPS-based issue tracking
🤖 AI-based resolution time prediction
🏛️ Government system integration
🤝 Contributing

