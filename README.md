# ETABS Beam Optimizer Live

A tool to optimize ETABS beams based on live model data.

---

## 🚀 Clone the Repository

First, clone the project:

```bash
git clone https://github.com/shanooo773/etabs-beam-optimizer-live.git
cd etabs-beam-optimizer-live
```

---

## ⚙️ Backend Setup

Make sure the following **prerequisites** are met before running the backend:

- ✅ ETABS is running  
- ✅ Your model is open  
- ✅ Beam names and loads are properly set  

### 📦 Run Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

---

## 💻 Frontend Setup

To start the frontend:

```bash
cd frontend
npm install   # Run this only once
npm install @craco/craco  # Run this only once
npm start
```