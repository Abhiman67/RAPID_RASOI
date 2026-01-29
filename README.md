# Rapid Rasoi 🍳

A restaurant order management simulation demonstrating **Non-Preemptive Priority Scheduling** algorithm - an Operating Systems concept applied to real-world kitchen workflow optimization.

![Rapid Rasoi](https://img.shields.io/badge/React-18-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3-blue)

## 🎯 About

Rapid Rasoi simulates how operating system CPU scheduling algorithms can be applied to manage restaurant orders efficiently. Watch priorities adapt in real-time based on waiting time, order type, and preparation duration.

## ✨ Features

- **Priority Queue Management** - Orders sorted by calculated priority
- **Dynamic Priority Calculation** - Priority updates based on waiting time
- **Reservation vs Walk-in** - Different priority weights for order types
- **Real-time Timeline Visualization** - Gantt chart showing order lifecycle
- **Statistics Dashboard** - Track average waiting time, turnaround time, throughput

## 🧮 Priority Formula

```
Priority = (0.5 × Arrival Factor) + (0.3 × Reservation Factor) + (0.2 × Burst Factor)
```

- **Arrival Factor (50%)**: How long the customer has been waiting
- **Reservation Factor (30%)**: Reserved orders get bonus priority
- **Burst Factor (20%)**: Shorter prep time = higher priority

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/Abhiman67/RapidRasoi.git

# Navigate to project
cd RapidRasoi

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

## 🛠️ Tech Stack

- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **Vite** - Build Tool
- **Shadcn/ui** - UI Components
- **Recharts** - Data Visualization

## 📖 OS Concepts Demonstrated

| Concept | Implementation |
|---------|---------------|
| Non-Preemptive Scheduling | Once cooking starts, it cannot be interrupted |
| Priority Scheduling | Orders processed by calculated priority |
| Turnaround Time | Total time from arrival to completion |
| Waiting Time | Time spent in queue before processing |
| Throughput | Orders completed per unit time |

## 👨‍💻 Author

**Abhiman67**

## 📄 License

This project is for educational purposes - OS Scheduling Simulation.
